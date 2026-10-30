// API membres - opérations d'administration
// Rôle reste membre, même pour l'admin

module.exports = async (req, res) => {
  const email = req.query.email;
  // Vérification basique - rôle toujours 'membre' côté front
  res.json({ role: 'membre', email });
};