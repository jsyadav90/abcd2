const assets = [
  {
    id: "1",
    name: "Laptop Dell XPS 13",
    type: "Electronics",
    location: "Office 1",
    status: "In use",
    owner: "Rahul",
  },
  {
    id: "2",
    name: "Projector Epson",
    type: "Electronics",
    location: "Conference Room",
    status: "Available",
    owner: "Admin",
  },
];

const generateId = () => Date.now().toString();

const getAll = () => assets;

const findById = (id) => assets.find((asset) => asset.id === id);

const create = (data) => {
  const newAsset = {
    id: generateId(),
    name: data.name,
    type: data.type,
    location: data.location || "",
    status: data.status || "Available",
    owner: data.owner || "",
  };
  assets.push(newAsset);
  return newAsset;
};

const update = (id, data) => {
  const asset = findById(id);
  if (!asset) {
    return null;
  }

  asset.name = data.name ?? asset.name;
  asset.type = data.type ?? asset.type;
  asset.location = data.location ?? asset.location;
  asset.status = data.status ?? asset.status;
  asset.owner = data.owner ?? asset.owner;

  return asset;
};

const remove = (id) => {
  const index = assets.findIndex((asset) => asset.id === id);
  if (index === -1) {
    return false;
  }

  assets.splice(index, 1);
  return true;
};

export default {
  getAll,
  findById,
  create,
  update,
  remove,
};
