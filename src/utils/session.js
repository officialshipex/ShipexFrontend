import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import axios from "axios";

const backendUrl = process.env.REACT_APP_BACKEND_URL;

// Create session (store token in cookie)
export function createSession(token) {
  
    const expiresAt = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000);
    Cookies.set('session', token, {
        expires: expiresAt,
        secure: true,
        sameSite: 'lax',
        path: '/',
    })
}

export async function getSession(role) {
  const session = Cookies.get('session');
  if (!session) {
    return null;
  }
  let url = `${backendUrl}/external/verify`;
  if (role === "employee") {
    url = `${backendUrl}/staffRole/verify`;
  }
  const response = await axios.get(url, {
    headers: {
      authorization: `Bearer ${session}`
    }
  });
  return response.data;
}

// Get the session token
export function getTokens() {
    const token = Cookies.get('session');
    console.log(token)
    if (!token) {
        return null;
    }
    return token;
}

// Function to delete session
export function deleteSession() {
  Cookies.remove('session', { path: '/' });
  
}

// Function to get user information from the token
export function getUserInfoFromToken() {
  const token = Cookies.get("session");
  if (!token) return null;

  try {
    const decoded = jwtDecode(token);
    // console.log("Decoded Token:", decoded);

    if (decoded.user && decoded.user.isEmployee === false) {
      // console.log("this is user");
      return { type: "user", ...decoded.user };
    } else if (decoded.employee && decoded.employee.isEmployee === true) {
      // console.log("this is employee");
      return { type: "employee", ...decoded.employee };
    } else {
      console.warn("Token structure unexpected:", decoded);
      return null;
    }
  } catch (error) {
    console.error("JWT Decode Error:", error);
    Cookies.remove("session");
    return null;
  }
}



// Function to get the session token
// export function getSession() {
//   return Cookies.get('session');
// }
