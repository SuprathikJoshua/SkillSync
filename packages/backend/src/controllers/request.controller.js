import {
  getAllRequestsService,
  addRequestService,
  updateRequestService,
} from "../services/request.services.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";

/**
 * Get all requests for the authenticated user
 */
export const getAllRequestsController = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  if (!userId) {
    throw new ApiError(400, "Login to view your requests");
  }

  const requests = await getAllRequestsService(userId);

  if (!requests) {
    throw new ApiError(404, "No requests found");
  }

  res
    .status(200)
    .json(new ApiResponse(200, requests, "Requests retrieved successfully"));
});
/**
 * Add a new request from the authenticated user to another user
 */
export const addRequestController = asyncHandler(async (req, res) => {
  const { toUserId, message, skillId } = req.body;
  const fromUserId = req.user._id;
  if (!skillId || !toUserId) {
    throw new ApiError(400, "toUserId and skillId are required");
  }
  const addRequest = await addRequestService(
    fromUserId,
    toUserId,
    message,
    skillId,
  );

  if (!addRequest) {
    throw new ApiError(500, "Failed to add request. Please try again later.");
  }

  res
    .status(200)
    .json(new ApiResponse(200, addRequest, "Request added successfully"));
});
/**
 *
 */
export const updateRequestController = asyncHandler(async (req, res) => {
  const { requestId } = req.params;
  const { status } = req.body;
  const userId = req.user._id;

  if (!requestId || !status) {
    throw new ApiError(400, "Request ID and status are required");
  }

  // Call the service to update the request status
  const updatedRequest = await updateRequestService(requestId, userId, status);

  if (!updatedRequest) {
    throw new ApiError(404, "Request not Found!!");
  }

  res
    .status(200)
    .json(new ApiResponse(200, updatedRequest, "Request updated successfully"));
});
