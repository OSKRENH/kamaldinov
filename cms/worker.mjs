import { normalize } from '../admin/model.js';

const REPO = 'https://api.github.com/repos/OSKRENH/kamaldinov/contents/content.json';
const SHA = /^[0-9a-f]{40}$/;
const LIMIT = 480_000;
const encoder = new TextEncoder();

function json(body, status = 200) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
}

function decode(data) {
  return Uint8Array.from(atob(data.replace(/-/g, '+').replace(/_/g, '/')), (char) => char.charCodeAt(0));
}

async function canEdit(request, env) {
  const token = request.headers.get('Cf-Access-Jwt-Assertion');
  if (!token || token.length > 12000 || !env.ACCESS_AUD || !env.ADMIN_EMAIL
      || !/^[a-z0-9-]+\.cloudflareaccess\.com$/.test(env.ACCESS_TEAM_DOMAIN || '')) return false;
  try {
    const issuer = 'https://' + env.ACCESS_TEAM_DOMAIN;
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const [header, body, signature] = parts;
    const { alg, kid } = JSON.parse(new TextDecoder().decode(decode(header)));
    if (alg !== 'RS256' || typeof kid !== 'string') return false;
    const claims = JSON.parse(new TextDecoder().decode(decode(body)));
    const now = Date.now() / 1000;
    if (claims.iss !== issuer || !Array.isArray(claims.aud) || !claims.aud.includes(env.ACCESS_AUD)
        || !Number.isFinite(claims.exp) || claims.exp <= now
        || (claims.nbf !== undefined && (!Number.isFinite(claims.nbf) || claims.nbf > now + 5))
        || typeof claims.email !== 'string' || claims.email.toLowerCase() !== env.ADMIN_EMAIL.trim().toLowerCase()) {
      return false;
    }
    const response = await fetch(issuer + '/cdn-cgi/access/certs', { redirect: 'error' });
    if (!response.ok) return false;
    const keys = (await response.json()).keys;
    const jwk = keys.find((key) => key.kid === kid && key.kty === 'RSA');
    if (!jwk) return false;
    const key = await crypto.subtle.importKey('jwk', jwk, {name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'}, false, ['verify']);
    return await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, decode(signature), encoder.encode(header + '.' + body));
  } catch { return false; }
}

async function input(request) {
  if (!request.body) throw Error('Пустой запрос.');
  const reader = request.body.getReader();
  const decoder = new TextDecoder('utf-8', { fatal:true });
  let total = 0;
  let text = '';
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > LIMIT) throw Error('Слишком много данных.');
      text += decoder.decode(value, { stream:true });
    }
    return JSON.parse(text + decoder.decode());
  } catch (error) {
    await reader.cancel().catch(() => {});
    throw error;
  }
}

function github(env, method, body) {
  return fetch(REPO + (method === 'GET' ? '?ref=main' : ''), {
    method, redirect:'error', headers:{
      'Authorization':'Bearer ' + env.GITHUB_TOKEN,
      'Accept':'application/vnd.github+json',
      'Content-Type':'application/json',
      'User-Agent':'kamaldinov-portfolio-editor',
    },
    body: body && JSON.stringify(body),
  });
}

function encode(text) {
  const bytes = encoder.encode(text);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return btoa(binary);
}

export default {
  async fetch(request, env) {
    if (!await canEdit(request, env)) return json({error:'Нужен вход с разрешённого адреса.'}, 403);
    const url = new URL(request.url);
    if (url.pathname === '/') return Response.redirect(new URL('/admin/', url), 302);
    if (['/admin/', '/admin/index.html', '/admin/editor.js', '/admin/model.js'].includes(url.pathname)
        && ['GET','HEAD'].includes(request.method)) return env.ADMIN_ASSETS.fetch(request);
    if (url.pathname !== '/api/content') return json({error:'Страница не найдена.'}, 404);
    if (!env.GITHUB_TOKEN) return json({error:'Публикация в GitHub пока не подключена.'}, 503);

    try {
      if (request.method === 'GET') {
        const response = await github(env, 'GET');
        if (!response.ok) return json({error:'GitHub не вернул опубликованные данные.'}, 502);
        const file = await response.json();
        if (!SHA.test(file.sha) || file.encoding !== 'base64') return json({error:'Файл редактора имеет неожиданный формат.'}, 502);
        return json({sha:file.sha, data:normalize(JSON.parse(new TextDecoder().decode(decode(file.content))))});
      }

      if (request.method === 'PUT') {
        if (request.headers.get('Origin') !== url.origin
          || request.headers.get('Content-Type')?.split(';')[0] !== 'application/json') {
          return json({error:'Запрос должен прийти из редактора.'}, 403);
        }
        let sha;
        let content;
        try {
          const data = await input(request);
          sha = data.sha;
          if (!SHA.test(sha || '')) return json({error:'Сначала загрузи актуальную версию.'}, 400);
          content = encode(JSON.stringify(normalize(data.data), null, 2) + '\n');
        } catch (error) {
          return json({error: error instanceof SyntaxError ? 'Проверь формат данных.' : error.message}, 400);
        }
        const result = await github(env, 'PUT', {branch:'main', message:'Update portfolio content', sha, content});
        if (result.status === 409 || result.status === 422) {
          return json({error:'GitHub отклонил обновление. Скопируй свои правки, загрузи текущую версию и попробуй снова.'}, 409);
        }
        if (!result.ok) return json({error:'GitHub не сохранил изменения. Проверь права доступа.'}, 502);
        return json({sha:(await result.json()).content.sha});
      }
      return json({error:'Метод недоступен.'}, 405);
    } catch {
      return json({error:'Не удалось связаться с GitHub. Попробуй ещё раз.'}, 502);
    }
  },
};
