const recruiterApplicationService = require('../Services/recruiter-application-service');
const {
  emitToRoom,
  emitToUser,
  getApplicationRoom,
  getJobRoom,
} = require('../socket/socket-server');

const toIdString = (value) => {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    if (value._id) return String(value._id);
    if (value.id) return String(value.id);
  }
  return String(value);
};

const emitRecruiterApplicationUpdate = ({ application, eventName, recruiterId }) => {
  if (!application || !eventName) return;

  const applicationId = toIdString(application._id);
  const jobId = toIdString(application.jobId);
  const applicantId = toIdString(application.applicant);

  const payload = {
    event: eventName,
    applicationId,
    jobId,
    applicantId,
    recruiterId: toIdString(recruiterId),
    status: application.status,
    interviews: application.interviews || [],
    updatedAt: application.updatedAt || new Date(),
  };

  if (applicantId) {
    emitToUser(applicantId, eventName, payload);
  }

  if (recruiterId) {
    emitToUser(recruiterId, eventName, payload);
  }

  if (jobId) {
    emitToRoom(getJobRoom(jobId), eventName, payload);
  }

  if (applicationId) {
    emitToRoom(getApplicationRoom(applicationId), eventName, payload);
  }
};

/**
 * @route GET /api/recruiter/jobs/:jobId/applications
 * @desc Get all applications for a job with filtering and sorting
 */
const getJobApplications = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const { status, sort, search, minScore, mustHave, missing, analysisStatus, page, limit } = req.query;
    const recruiterId = req.user.id;

    const result = await recruiterApplicationService.getJobApplications(
      jobId,
      recruiterId,
      { status, sort, search, minScore, mustHave, missing, analysisStatus, page, limit }
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

    console.log('[RECRUITER STATUS][CONTROLLER] Status update request received:', {
      applicationId,
      recruiterId,
      incomingStatus: status,
    });

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
    emitRecruiterApplicationUpdate({
      application: updatedApplication,
      eventName: 'application:statusUpdated',
      recruiterId,
    });

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

    console.log('[RECRUITER STATUS][CONTROLLER][BULK] Bulk status update request received:', {
      jobId,
      recruiterId,
      applicationIds,
      incomingStatus: status,
    });

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
    const payload = {
      event: 'application:statusUpdated',
      recruiterId,
      jobId,
      applicationIds,
      status: result.status,
      updatedAt: new Date(),
    };
    emitToUser(recruiterId, 'application:statusUpdated', payload);
    emitToRoom(getJobRoom(jobId), 'application:statusUpdated', payload);

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

/**
 * @route GET /api/recruiter/dashboard/recent-activity
 * @desc Get recent recruiter activity from real jobs/applications data
 */
const getRecentRecruiterActivity = async (req, res, next) => {
  try {
    const recruiterId = req.user.id;
    const { page, limit } = req.query;

    const result = await recruiterApplicationService.getRecruiterRecentActivity(recruiterId, { page, limit });

    res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getJobApplications,
  updateApplicationStatus,
  bulkUpdateApplicationStatus,
  getApplicationDetails,
  getRecentRecruiterActivity,
};
