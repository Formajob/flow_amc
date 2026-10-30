// Gestion des emails membres
// AMC_MEMBER_EMAILS ou AMC_ACCESS_JSON

const memberEmails = process.env.AMC_MEMBER_EMAILS 
  ? process.env.AMC_MEMBER_EMAILS.split(',')
  : [];

exports.isMember = (email) => {
  return memberEmails.includes(email.toLowerCase());
};