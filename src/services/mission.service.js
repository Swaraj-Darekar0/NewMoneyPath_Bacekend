const missionModel = require('../models/mission.model');
const userModel = require('../models/user.model');
const { NotFoundError, AuthorizationError, ValidationError } = require('../utils/errors');
const disciplineService = require('./discipline.service');
const auditLogModel = require('../models/auditLog.model');

const createMission = async (userId, missionData) => {
  const user = await userModel.findById(userId);
  if (!user) {
    throw new NotFoundError('User not found.');
  }

  // Placeholder for mission limit check
  const missions = await missionModel.findByUserId(userId, { status: 'active' });
  if (missions.length >= 20) {
    throw new ValidationError('Mission limit reached (max 20 active missions).');
  }

  const mission = await missionModel.create({ ...missionData, user_id: userId });

  disciplineService.handleMissionChange(userId);

  await auditLogModel.create({
    user_id: userId,
    action: 'mission_created',
    entity_type: 'mission',
    entity_id: mission.id,
    new_values: mission,
  });

  return mission;
};

const getMissions = async (userId, filters) => {
  const missions = await missionModel.findByUserId(userId, filters);
  
  // Group by priority as per the guide
  const groupedMissions = {
    non_negotiable: [],
    big_moves: [],
    flex_goals: [],
  };

  missions.forEach(mission => {
    if (groupedMissions[mission.priority]) {
      groupedMissions[mission.priority].push(mission);
    }
  });

  return groupedMissions;
};

const getMissionById = async (userId, missionId) => {
  const mission = await missionModel.findById(missionId);
  if (!mission) {
    throw new NotFoundError('Mission not found.');
  }
  if (mission.user_id !== userId) {
    throw new AuthorizationError('You are not authorized to view this mission.');
  }
  return mission;
};

const updateMission = async (userId, missionId, updates) => {
  await getMissionById(userId, missionId); // Authorization check

  const updatedMission = await missionModel.update(missionId, updates);

  if (updates.target_amount || updates.duration_days) {
    disciplineService.handleMissionChange(userId);
  }

  await auditLogModel.create({
    user_id: userId,
    action: 'mission_updated',
    entity_type: 'mission',
    entity_id: missionId,
    new_values: updates,
  });

  return updatedMission;
};

const deleteMission = async (userId, missionId) => {
  const mission = await getMissionById(userId, missionId); // Authorization check

  if (mission.priority === 'non_negotiable') {
    throw new ValidationError('Cannot delete non-negotiable missions. Please archive it instead.');
  }

  await missionModel.delete(missionId);

  disciplineService.handleMissionChange(userId);

  await auditLogModel.create({
    user_id: userId,
    action: 'mission_deleted',
    entity_type: 'mission',
    entity_id: missionId,
  });

  return { message: 'Mission deleted successfully.' };
};

const archiveMission = async (userId, missionId) => {
  await getMissionById(userId, missionId); // Authorization check

  const archivedMission = await missionModel.archive(missionId);

  disciplineService.handleMissionChange(userId);

  await auditLogModel.create({
    user_id: userId,
    action: 'mission_archived',
    entity_type: 'mission',
    entity_id: missionId,
  });

  return archivedMission;
};

const reorderMissions = async (userId, priority, order) => {
  // Basic validation
  if (!order || !Array.isArray(order) || order.length === 0) {
    throw new ValidationError('A valid order array is required.');
  }

  // More comprehensive validation can be added here to ensure all IDs belong to the user and priority

  await missionModel.reorder(userId, priority, order);

  return { message: 'Missions reordered successfully.' };
};

// This function is part of the discipline engine, but defined here as per the guide
const allocateSavingsToMissions = async (userId, savingsAmount) => {
  const missions = await missionModel.findByUserId(userId, { status: 'active' });
  if (missions.length === 0) return { message: 'No active missions to allocate savings to.' };

  const allocation = {
    non_negotiable: { total: 0, missions: {} },
    big_moves: { total: 0, missions: {} },
    flex_goals: { total: 0, missions: {} },
  };

  const nonNegotiableMissions = missions.filter(m => m.priority === 'non_negotiable');
  const bigMovesMissions = missions.filter(m => m.priority === 'big_moves');
  const flexGoalsMissions = missions.filter(m => m.priority === 'flex_goals');

  // Allocate to Non-Negotiable
  if (nonNegotiableMissions.length > 0) {
    const allocationAmount = savingsAmount * 0.6;
    const amountPerMission = Math.floor(allocationAmount / nonNegotiableMissions.length);
    for (const mission of nonNegotiableMissions) {
      await missionModel.updateSavings(mission.id, amountPerMission);
      allocation.non_negotiable.total += amountPerMission;
      allocation.non_negotiable.missions[mission.name] = amountPerMission;
    }
  }

  // ... similar logic for big_moves (30%) and flex_goals (10%)
  // This is a simplified version. A full implementation would handle proportions and remainders.

  return { message: 'Savings allocated', allocation };
};


module.exports = {
  createMission,
  getMissions,
  getMissionById,
  updateMission,
  deleteMission,
  archiveMission,
  reorderMissions,
  allocateSavingsToMissions,
};
