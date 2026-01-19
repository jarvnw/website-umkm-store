
import crypto from 'crypto';

/**
 * Backend service for ImageKit Server-side Authentication.
 * This generates the required signature for secure client-side uploads.
 * Standard implementation for Vercel Serverless Functions.
 */
export default function handler(req: any, res: any) {
  const privateKey = process.env.VITE_IMAGEKIT_PRIVATE_KEY || process.env.IMAGEKIT_PRIVATE_KEY;
  
  if (!privateKey) {
    return res.status(500).json({ 
      error: "ImageKit Private Key is not configured on the server." 
    });
  }

  // Generate unique token and expiration timestamp (valid for 30 minutes)
  const token = req.query.token || crypto.randomBytes(16).toString('hex');
  const expire = req.query.expire || Math.floor(Date.now() / 1000) + 1800;

  // HMAC-SHA1 signing for security
  const signature = crypto
    .createHmac('sha1', privateKey)
    .update(token + expire)
    .digest('hex');

  res.status(200).json({
    token,
    expire,
    signature,
  });
}
