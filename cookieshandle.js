function setCookie(name, value, years = 10, path = '/') {
    const expiresDate = new Date();
    expiresDate.setFullYear(expiresDate.getFullYear() + years);
    const cookieStr = [
      `${encodeURIComponent(name)}=${encodeURIComponent(value)}`,
      `expires=${expiresDate.toUTCString()}`,
      `path=${path}`
    ].join('; ');
    document.cookie = cookieStr;
}

function getCookie(name) {
    const value = "; " + document.cookie;
    const parts = value.split("; " + name + "=");
    if (parts.length === 2) {
      return parts.pop().split(";").shift();
    }
    return null;
}
