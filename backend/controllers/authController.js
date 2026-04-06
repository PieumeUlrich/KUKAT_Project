// authRoutes.js
import { verifyPassword } from '../authServices/auth.js';
import { generateAccessToken } from '../authServices/token.js';
import getConnection from '../db/connection.js';

export const loginUser = async (req, res) => {

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    // const pool = await getConnection();
    // const result = await pool.request()
    //   .input('Email', email)
    //   .query(`
    //     SELECT TOP 1 AccountId, UPPER(Username) AS Username, PasswordHash, IsActive, Role
    //     FROM URLICH.ACCOUNT
    //     WHERE Email = @Email
    //   `);

    // if (result.recordset.length === 0) {
    //   // Avoid revealing whether email exists
    //   return res.status(401).json({ message: 'Invalid credentials.' });
    // }

    // const user = result.recordset[0];

    // if (!user.IsActive) {
    //   return res.status(403).json({ message: 'Account is disabled.' });
    // }

    // const passwordMatch = await verifyPassword(password, user.PasswordHash);

    // if (!passwordMatch) {
    //   return res.status(401).json({ message: 'Invalid credentials.' });
    // }

    // const token = generateAccessToken(user);

    // Option A: send token in JSON (for SPA)
    // return res.status(200).json({
    //   token,
    //   user: {
    //     accountId: user.AccountId,
    //     username: user.Username,
    //     role: user.Role
    //   }
    // });

    return res.status(200).json({
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwidXNlcm5hbWUiOiJNQVRIRUFXIEZPTlRBSU5FIiwiYWNjb3VudElkIjoxLCJyb2xlIjoic3VwZXJhZG1pbiIsImlhdCI6MTY5ODQ4ODg0OSwiZXhwIjoxNjk4NDg5NzQ5fQ.7n8sHj8mLh9e7vKqjN8sHj8mLh9e7vKqjN8sHj8mLh9e7vKqjN8sHj8mLh9e7vKqjN8sHj8mLh9e7vKqjN8sHj8mLh9e7vKqjN8sHj8mLh9e7vKqjN8sHj8mLh9e7vKqjN8sHj8mLh9e7vKqjN8sHj8mLh9e7vKqjN8sHj8mLh9e7vKqjN8sHj8mLh9e7vKqjN8sHj8mLh9e7vKqjN8sHj8mLh9e7vKqjN8sHj8mLh9e7vKqjN8sHj8mLh9e7vKqjN8sHj8mLh9e7vKqjN8sHj8mLh9e7vKqjN8sHj8mLh9e7vKqjN8sHj8mLh9e7vKqjN8sHj8mLh9e7vKqjN",
      "user": {
        "employeeID": 1,
        "firstName": "Marie",
        "lastName": "Fontaine",
        "email": "marie.fontaine@kukat.ca",
        "role": "superadmin",
        "agentCode": "SA01"
      }
    });
    
    // Option B (more secure): set HTTP-only cookie instead of JSON token
    // res.cookie('access_token', token, {
    //   httpOnly: true,
    //   secure: true,
    //   sameSite: 'strict',
    //   maxAge: 15 * 60 * 1000
    // });
    // return res.status(200).json({ message: 'Login successful.' });

  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};


export const logoutUser = (req, res) => {
  // For token-based auth, client simply deletes token. Optionally, implement server-side token blacklist.
  // For cookie-based auth, clear the cookie:
  // res.clearCookie('access_token', {
  //   httpOnly: true,
  //   secure: true,  
  //   sameSite: 'strict'
  // });
  return res.status(200).json({ message: 'Logout successful.' });

};

export const SignupUser = async (req, res) => {
  try {
    const { employeeId, username, email, password, role } = req.body;

    const passwordHash = await hashPassword(password);

    const pool = await getPool();
    const result = await pool
      .request()
      .input('EmployeeId', employeeId)
      .input('Username', username)
      .input('Email', email)
      .input('PasswordHash', passwordHash)
      .input('Role', role || 'User')
      .query(`
        INSERT INTO dbo.Account (EmployeeId, Username, Email, PasswordHash, Role)
        VALUES (@EmployeeId, @Username, @Email, @PasswordHash, @Role);

        SELECT SCOPE_IDENTITY() AS AccountId;
      `);

    return res.status(201).json({
      accountId: result.recordset[0].AccountId,
      username,
      email,
      role: role || 'User'
    });
  } catch (err) {
    console.error('Create account error:', err);
    return res.status(500).json({ message: 'Internal server error.' });
  }
};