// src/controllers/userController.js
const { where } = require("sequelize");
const db = require("../models");
const { getFileUrl } = require("../utils/utils");

// Get properties for the requested user
exports.getPropertiesForUser = async (req, res) => {
  try {
    const { user_id, user_type_category_id, user_type_mapping_id } = req.user;
    let where_condition;
    let attributes = ["first_name", "last_name"];
    let include = [];

    if (user_type_category_id === 3) {
      where_condition = { user_id };
    } else if (user_type_category_id === 5) {
      const partnerBuilder = await db.PartnerBuilder.findOne({
        where: { user_type_mapping_id },
      });
      const company_id = partnerBuilder.company_id;
      where_condition = { company_id };
      include.push({
        model: db.PartnerBuilderProject,
        attributes: ["partner_builder_project_name"],
        as: "partner_builder_project",
      });
    } else if (user_type_category_id === 1 || user_type_category_id === 2) {
      attributes.push("user_id");
    }

    include.push({
      model: db.User,
      attributes,
      as: "user",
    });

    const properties = await db.Property.findAll({
      include,
      where: { ...where_condition, is_active: 1 },
    });

    const propertiesWithFiles = await Promise.all(
      properties.map(async (property) => {
        const propertyData = property.toJSON();
        // ensure images and documents are in proper json array format 2024-05-13
        // const images = await (propertyData.images.length ? JSON.parse(propertyData.images) : []);
        // const documents = await (propertyData.documents.length ? JSON.parse(propertyData.documents) : []);

        let images = await (propertyData.images.length
          ? JSON.parse(propertyData.images)
          : []);
        let documents = await (propertyData.documents.length
          ? JSON.parse(propertyData.documents)
          : []);
        if (typeof images === "string") {
          images = JSON.parse(images);
        }
        if (typeof documents === "string") {
          documents = JSON.parse(documents);
        }

        const imageUrls = await Promise.all(
          images.map(async (image) => {
            const imageUrl = await getFileUrl(image);
            return imageUrl;
          })
        );

        const documentUrls = await Promise.all(
          documents.map(async (document) => {
            const documentUrl = await getFileUrl(document);
            return documentUrl;
          })
        );

        propertyData.images = images;
        propertyData.imagesUrls = imageUrls;
        propertyData.documents = documents;
        propertyData.documentsUrls = documentUrls;

        return propertyData;
      })
    );

    res.status(200).json({ properties: propertiesWithFiles });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch properties" });
  }
};

// user dashboard
exports.userDashboard = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const query = `
      SELECT
        p.property_name,
        p.prop_unique_id,
        GROUP_CONCAT(DISTINCT s.service_name SEPARATOR ', ') AS services,
        sub.start_date AS subscription_start_date,
        sub.end_date AS subscription_end_date,
        sub.created_at AS subscription_creation_date,
        sub.subscription_id,
        sub.invoice,
        sub.invoice_no,
        sub.status AS subscription_status,
        sub.invoice_date, 
        sub.invoice_from_address, 
        sub.invoice_to_address, 
        sub.invoice_to_name,
        sub.invoice_property_name, 
        sub.invoice_package_name, 
        sub.invoice_area,
        sub.package_price,
        pkg.package_name,
        pkg.status AS package_status
      FROM
        property AS p
      LEFT JOIN
        subscription AS sub ON p.property_id = sub.property_id
      LEFT JOIN
        package AS pkg ON sub.package_id = pkg.package_id
      LEFT JOIN
        package_service AS ps ON pkg.package_id = ps.package_id
      LEFT JOIN
        service AS s ON ps.service_id = s.service_id
      WHERE
        p.user_id = :userId
      GROUP BY
        p.property_id, sub.subscription_id
    `;

    const propertyDetails = await db.sequelize.query(query, {
      replacements: { userId },
      type: db.sequelize.QueryTypes.SELECT,
    });

    if (!propertyDetails || propertyDetails.length === 0) {
      return res
        .status(200)
        .json({ error: "No properties found for the user" });
    }

    const propertiesWithFiles = await Promise.all(
      propertyDetails.map(async (propertyData) => {
        const invoices = await (propertyData.invoice &&
        propertyData.invoice.length
          ? JSON.parse(propertyData.invoice)
          : []);

        const invoiceUrls = await Promise.all(
          invoices.map(async (invoice) => {
            const invoiceUrl = await getFileUrl(invoice);
            return invoiceUrl;
          })
        );

        propertyData.invoices = invoices;
        propertyData.invoicesUrls = invoiceUrls;

        return propertyData;
      })
    );

    res.status(200).json({ properties: propertiesWithFiles });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch property details" });
  }
};

exports.getReferredBy = async (req, res) => {
  try {
    const { user_id } = req.user;
    const referred_by = await db.User.findByPk(user_id, {
      attributes: ["referred_by"],
    });

    res.status(200).json({ referred_by });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to get Referred By" });
  }
};
exports.property_package_valid = async (req, res) => {
  try {
    //  const { package_id} = req.params;
    const { package_id } = req.body;
    console.log("pkgId", package_id);
    const package_id_1 = package_id;
    const queryforcount = `select count(package_id) as count from package where package_id= ${package_id_1} and is_active=1`;
    let CountDetails = await db.sequelize.query(queryforcount, {
      type: db.sequelize.QueryTypes.SELECT,
    });
    const exist_count = CountDetails[0].count;
    console.log("exist_count", exist_count);
    res.status(200).json({ exist_count });
  } catch (error) {
    console.error(error);
    //   res.status(500).json({ error: 'Failed to get Referred By' });
  }
};
