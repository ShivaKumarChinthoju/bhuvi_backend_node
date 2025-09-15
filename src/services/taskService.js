// src/sevices/taskService.js
const db = require('../models');
const partnerBuilderService = require('../services/partnerBuilderService');
const channelPartnerService = require('../services/channelPartnerService');
const { Op } = require('sequelize');

const monthly = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const quarterly = ['1st Quarter', '2nd Quarter', '3rd Quarter', '4th Quarter'];
const half_yearly = ['Jan - Jun', 'Jul - Dec'];


exports.createTasks = async (subscription_id, options = {}) => {
    const { transaction } = options;

    try {
        const subscription = await db.Subscription.findByPk(subscription_id, {
            include: [
                {
                    model: db.Property,
                    attributes: ['partner_builder_project_id', 'area'],
                },
                {
                    model: db.User,
                    attributes: ['referred_by'],
                }
            ],
            transaction, // Use transaction if provided
        });

        const { property_id, package_id, user_id, tasks_created } = subscription;

        if (tasks_created) {
            throw new Error(`Tasks already created for subscription_id :: ${subscription_id}`);
        }

        const packageServices = await db.PackageService.findAll({
            where: {
                is_active: 1,
                package_id: subscription.package_id
            },
            include: [
                {
                    model: db.Service,
                    attributes: ['service_id', 'service_name'],
                    as: 'Service',
                    where: { is_active: 1 },
                }
            ],
            transaction, // Use transaction if provided
        });

        const tasks = packageServices.map((packageService) => {
        const { service_id, service_name } = packageService.Service;

        return {
            subscription_id,
            property_id,
            user_id,
            package_id,
            service_id,
            service_name,
        };
        });

        await db.Task.bulkCreate(tasks, { transaction }); // Use transaction if provided

        const { partner_builder_project_id, area } = subscription.property;
        const { referred_by: channel_partner_user_id } = subscription.user;

        let commission = null;
        if (partner_builder_project_id) {
            commission = await partnerBuilderService.getCommissionByArea(partner_builder_project_id, area, { transaction });
        }
        if (channel_partner_user_id) {
            await channelPartnerService.addCommissionWrapper(subscription, { transaction });
        }

        await subscription.update({ tasks_created: 1, commission }, { transaction });
        console.log(`Tasks created successfully for subscription_id = ${subscription_id}`);
    } catch (error) {
        console.error(error);
        throw error;
    }
};

// Function to validate a date string
exports.isValidDate = (dateString) => {
    const regex = /^\d{4}-\d{2}-\d{2}$/; // ISO 8601 date format
    return regex.test(dateString) && !isNaN(Date.parse(dateString));
}

// Function to validate status
exports.isValidStatus = (status) => {
    const validStatuses = ["Pending", "Ongoing", "Completed"];
    return typeof status === 'string' && validStatuses.includes(status);
}
