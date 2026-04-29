import assetModel from "../models/assets/asset.Model.js";

const getAllAssets = (req, res) => {
  const assets = assetModel.getAll();
  res.json(assets);
};

const getAssetById = (req, res) => {
  const asset = assetModel.findById(req.params.id);

  if (!asset) {
    return res.status(404).json({ error: "Asset not found" });
  }

  res.json(asset);
};

const createAsset = (req, res) => {
  const { name, type, location, status, owner } = req.body;
  if (!name || !type) {
    return res.status(400).json({ error: "Asset name and type are required" });
  }

  const newAsset = assetModel.create({ name, type, location, status, owner });
  res.status(201).json(newAsset);
};

const updateAsset = (req, res) => {
  const { name, type, location, status, owner } = req.body;
  const updated = assetModel.update(req.params.id, { name, type, location, status, owner });

  if (!updated) {
    return res.status(404).json({ error: "Asset not found" });
  }

  res.json(updated);
};

const deleteAsset = (req, res) => {
  const deleted = assetModel.remove(req.params.id);

  if (!deleted) {
    return res.status(404).json({ error: "Asset not found" });
  }

  res.json({ message: "Asset deleted successfully" });
};

export {
  getAllAssets,
  getAssetById,
  createAsset,
  updateAsset,
  deleteAsset,
};
