const supabase = require('@supabase/supabase-js')(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// POST /api/session - connexion
exports.login = async (req, res) => {
  const { email, password } = req.body;
  // Vérification simple - à remplacer par authentification réelle
  const userEmail = process.env.AMC_ADMIN_EMAIL || 'zouzou.douni@gmail.com';
  if (email === userEmail && password === process.env.AMC_ADMIN_PASSWORD) {
    res.cookie('amc_session', 'admin', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
    res.json({ email, role: 'admin' });
  } else {
    // Membre vérification
    const { data: member } = await supabase
      .from('amc_operators')
      .select('role')
      .eq('email', email)
      .single();
    if (member && member.role === 'membre') {
      res.cookie('amc_session', 'membre', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      });
      res.json({ email, role: 'membre' });
    } else {
      res.status(401).json({ message: 'Accès refusé' });
    }
  }
};

// GET /api/session - vérifier la session
exports.getSession = async (req, res) => {
  const cookie = req.cookies.amc_session;
  if (cookie === 'admin') {
    res.json({ email: process.env.AMC_ADMIN_EMAIL || 'zouzou.douni@gmail.com', role: 'admin' });
  } else if (cookie === 'membre') {
    res.json({ email: req.query.email || '', role: 'membre' });
  } else {
    res.status(401).json({});
  }
};

// DELETE /api/session - déconnexion
exports.logout = async (req, res) => {
  res.clearCookie('amc_session');
  res.json({ success: true });
};

module.exports = { login, getSession, logout };