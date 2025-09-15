// src/routes/propertyRoutes.js
const express = require('express');
const propertyController = require('../controllers/propertyController');
const authMiddleware = require('../middlewares/authMiddleware');
const multer = require('multer');

const router = express.Router();

const upload = multer();

router.use(authMiddleware.addUserToRequest);

// router.post('/add-property', propertyController.addProperty);
router.post('/add-property', upload.fields([{ name: 'images', maxCount: 10 }, { name: 'documents', maxCount: 10 }]), propertyController.addProperty);
router.put('/edit-property/:property_id', upload.fields([{ name: 'images', maxCount: 10 }, { name: 'documents', maxCount: 10 }]), propertyController.editProperty);
router.post('/invoice', upload.fields([{ name: 'invoices', maxCount: 10 }]), propertyController.addInvoice);

router.post('/get-property-by-reference-code', propertyController.getPropertyByReferenceCode)


module.exports = router;