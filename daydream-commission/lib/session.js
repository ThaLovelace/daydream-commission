const { cookies } = require('next/headers');

const COOKIE_NAME = 'daydream_uid';

function getSessionUserId() {
  return cookies().get(COOKIE_NAME)?.value || null;
}

function setSessionCookie(userId) {
  cookies().set(COOKIE_NAME, userId, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  });
}

function clearSessionCookie() {
  cookies().delete(COOKIE_NAME);
}

module.exports = { COOKIE_NAME, getSessionUserId, setSessionCookie, clearSessionCookie };
