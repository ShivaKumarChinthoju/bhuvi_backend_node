// src/controllers/authController.js
const authService = require('../services/authService');
const partnerBuilderService = require('../services/partnerBuilderService')
const db = require('../models');

async function adminLogin(req, res) {
  const { email, password } = req.body;

  try {
    const response = await authService.adminLogin(email, password);
    res.json(response);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An error occurred while logging in' });
  }
}


async function customerLogin(req, res) {
  const { email, password, user_type_category_id } = req.body;

  try {
    const response = await authService.customerLogin(email, password, user_type_category_id);
    res.json(response);
  } catch (error) {
    console.error(error);
    // res.status(500).json({ message: 'An error occurred while logging in' });
    res.status(500).json({ message: error.message });
  }
}


async function customerSignup(req, res) {
  // const { email, password, user_type_id, first_name, last_name, mobile } = req.body;

  try {
    // const response = await authService.customerSignup(email, password);
    const response = await authService.customerSignup(req.body);
    res.json(response);
  } catch (error) {
    console.error(error);
    // res.status(500).json({ message: 'An error occurred while signing up' });
    res.status(500).json({ message: error.message });
  }
}


async function verifyEmail(req, res) {
  const { email, otp } = req.body;

  try {
    const response = await authService.verifyEmail(email, otp);
    res.json(response);
  } catch (error) {
    console.error(error);
    // res.status(500).json({ message: 'An error occurred while verifying email' });
    res.status(500).json({ message: error.message });
  }
}


async function verificationEmailToSuperadmins(req, res) {
  const { message } = req.body;
  const { user_id } = req.user;

  try {
    const response = await authService.sendVerificationEmailToSuperadmins(user_id, message);
    res.status(200).json(response);
  } catch (error) {
    console.error(error);
    // res.status(500).json({ message: 'An error occurred while verifying email' });
    res.status(500).json({ message: error.message });
  }
}


async function forgotPasswordOtp(req, res) {
  const { email } = req.body;

  try {
    const response = await authService.sendForgotPasswordOtp(email);
    res.json(response);
  } catch (error) {
    console.error(error);
    // res.status(500).json({ message: 'An error occurred while verifying email' });
    res.status(500).json({ message: error.message });
  }
}


async function resetPassword(req, res) {
  const { email, password, otp } = req.body;

  try {
    const response = await authService.resetPassword(email, password, otp);
    res.json(response);
  } catch (error) {
    console.error(error);
    // res.status(500).json({ message: 'An error occurred while verifying email' });
    res.status(500).json({ message: error.message });
  }
}


async function partnerBuilderSignup(req, res) {
  try {
    // const response = await authService.customerSignup(email, password);

    const { email, password, first_name, last_name, mobile,company_name } = req.body;

    const existingCompany = await db.Company.findOne({where:{company_name}})
    if(existingCompany){
      return res.status(400).json({message:'company with same name already exist,Please enter a different name.'})
    }
    const partnerBuilderData = {
      email,
      password,
      user_type_id: 5,
      first_name,
      last_name,
      mobile
    }

    //const { company_name } = req.body
    const response = await authService.customerSignup(partnerBuilderData);
    const { message, newUserTypeMapping } = response;
    const company = await partnerBuilderService.addCompany({ company_name });
    const { user_type_mapping_id, user_id } = newUserTypeMapping;
    await partnerBuilderService.addPartnerBuilder(user_id, user_type_mapping_id, company.company_id);
    res.json({ message });
  } catch (error) {
    console.error(error);
    // res.status(500).json({ message: 'An error occurred while signing up' });
    res.status(500).json({ message: error.message });
  }
}

module.exports = {
  adminLogin,
  customerLogin,
  customerSignup,
  verifyEmail,
  verificationEmailToSuperadmins,
  forgotPasswordOtp,
  resetPassword,
  partnerBuilderSignup
};
