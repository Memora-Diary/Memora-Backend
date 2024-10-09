const jwt = require('jsonwebtoken');
const { JwksClient } = require('jwks-rsa');

// Replace YOUR_DYNAMIC_ENV_ID with your actual Dynamic environment ID
const jwksUrl = `https://app.dynamic.xyz/api/v0/sdk/YOUR_DYNAMIC_ENV_ID/.well-known/jwks`;

const client = new JwksClient({
  jwksUri: jwksUrl,
  rateLimit: true,
  cache: true,
  cacheMaxEntries: 5,
  cacheMaxAge: 600000
});

async function verifyToken(req, res, next) {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const signingKey = await client.getSigningKey();
    const publicKey = signingKey.getPublicKey();

    const decodedToken = jwt.verify(token, publicKey, {
      ignoreExpiration: false,
    });

    if (decodedToken.scopes.includes('requiresAdditionalAuth')) {
      return res.status(403).json({ message: 'Additional verification required' });
    }

    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Token verification failed:', error);
    res.status(401).json({ message: 'Invalid token' });
  }
}

module.exports = verifyToken;