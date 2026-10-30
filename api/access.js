// GET /api/access?email= - vérification d'accès
// CORS seulement pour https://acx-flow.vercel.app
// Renvoie { space: "amc" } ou 404
// Pas de rôle dans l'URL, seulement l'espace

module.exports = (req, res) => {
  const origin = req.headers.origin;
  if (origin !== 'https://acx-flow.vercel.app') {
    return res.status(404).json({ error: 'Not found' });
  }
  const email = req.query.email;
  // Les deux graphies admin, puis tout mail accepté
  const adminEmails = ['zouzou.douni@gmail.com', 'ouzou.douni@gmail.com'];
  if (adminEmails.includes(email) || process.env.AMC_ACCESS_EMAILS?.split(',').includes(email)) {
    res.json({ space: 'amc' });
  } else {
    res.status(404).json({ error: 'Not found' });
  }
};