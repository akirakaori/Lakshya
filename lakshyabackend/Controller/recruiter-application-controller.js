const recruiterApplicationService = require('../Services/recruiter-application-service');

/**
 * @route GET /api/recruiter/jobs/:jobId/applications
 * @desc Get all applications for a job with filtering and sorting
 */
const getJobApplications = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const { status, sort, search, minScore, mustHave, missing } = req.query;
    const recruiterId = req.user.id;

    const result = await recruiterApplicationService.getJobApplications(
      jobId,
      recruiterId,
      { status, sort, search, minScore, mustHave, missing }
    );

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route PATCH /api/recruiter/applications/:applicationId/status
 * @desc Update application status
 */
const updateApplicationStatus = async (req, res, next) => {
  try {
    const { applicationId } = req.params;
    const { status } = req.body;
    const recruiterId = req.user.id;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const updatedApplication = await recruiterApplicationService.updateApplicationStatus(
      applicationId,
      recruiterId,
      status
    );

    res.status(200).json({
      success: true,
      message: 'Application status updated successfully',
      data: updatedApplication
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route PATCH /api/recruiter/jobs/:jobId/applications/bulk-status
 * @desc Bulk update application statuses
 */
const bulkUpdateApplicationStatus = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const { applicationIds, status } = req.body;
    const recruiterId = req.user.id;

    if (!applicationIds || !Array.isArray(applicationIds) || applicationIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Application IDs array is required'
      });
    }

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const result = await recruiterApplicationService.bulkUpdateApplicationStatus(
      jobId,
      recruiterId,
      applicationIds,
      status
    );

    res.status(200).json({
      success: true,
      message: `${result.modifiedCount} application(s) updated to ${result.status}`,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route GET /api/recruiter/applications/:applicationId
 * @desc Get single application details with candidate profile and match snapshot
 */
const getApplicationDetails = async (req, res, next) => {
  try {
    const { applicationId } = req.params;
    const recruiterId = req.user.id;

    const result = await recruiterApplicationService.getApplicationDetails(
      applicationId,
      recruiterId
    );

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getJobApplications,
  updateApplicationStatus,
  bulkUpdateApplicationStatus,
  getApplicationDetails
};
