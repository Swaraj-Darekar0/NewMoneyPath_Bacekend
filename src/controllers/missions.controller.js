const missionService = require('../services/mission.service');

const createMission = async (req, res, next) => {
  try {
    const mission = await missionService.createMission(req.user.id, req.validatedBody);
    res.status(201).json(mission);
  } catch (error) {
    next(error);
  }
};

const getMissions = async (req, res, next) => {
  try {
    const missions = await missionService.getMissions(req.user.id, req.query);
    res.status(200).json(missions);
  } catch (error) {
    next(error);
  }
};

const getMissionById = async (req, res, next) => {
  try {
    const mission = await missionService.getMissionById(req.user.id, req.params.id);
    res.status(200).json(mission);
  } catch (error) {
    next(error);
  }
};

const updateMission = async (req, res, next) => {
  try {
    const updatedMission = await missionService.updateMission(req.user.id, req.params.id, req.validatedBody);
    res.status(200).json(updatedMission);
  } catch (error) {
    next(error);
  }
};

const deleteMission = async (req, res, next) => {
  try {
    const result = await missionService.deleteMission(req.user.id, req.params.id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const archiveMission = async (req, res, next) => {
  try {
    const archivedMission = await missionService.archiveMission(req.user.id, req.params.id);
    res.status(200).json(archivedMission);
  } catch (error) {
    next(error);
  }
};

const reorderMissions = async (req, res, next) => {
  try {
    const { priority, order } = req.validatedBody;
    const result = await missionService.reorderMissions(req.user.id, priority, order);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createMission,
  getMissions,
  getMissionById,
  updateMission,
  deleteMission,
  archiveMission,
  reorderMissions,
};
