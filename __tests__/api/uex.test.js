jest.mock('../../config/database', () => ({
  UexTerminal: { findAll: jest.fn(), findByPk: jest.fn() },
  UexItemPrice: { findAll: jest.fn() },
  UexCommodityPrice: { findAll: jest.fn() },
  UexFuelPrice: { findAll: jest.fn() },
  UexVehiclePurchasePrice: { findAll: jest.fn() },
  UexVehicleRentalPrice: { findAll: jest.fn() }
}));

const { Op } = require('sequelize');
const {
  searchTerminals,
  getTerminalInventory,
  getTerminalsForItem
} = require('../../api/uex');
const {
  UexTerminal,
  UexItemPrice,
  UexCommodityPrice,
  UexFuelPrice,
  UexVehiclePurchasePrice,
  UexVehicleRentalPrice
} = require('../../config/database');

function mockRes() {
  return { status: jest.fn().mockReturnThis(), json: jest.fn() };
}

describe('api/uex searchTerminals', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns terminal list', async () => {
    const req = { query: { name: 'T1' } };
    const res = mockRes();
    UexTerminal.findAll.mockResolvedValue([{ id: 1 }]);

    await searchTerminals(req, res);

    expect(UexTerminal.findAll).toHaveBeenCalledWith({
      where: { [Op.and]: [{ name: { [Op.like]: '%T1%' } }] }
    });
    expect(res.json).toHaveBeenCalledWith({ terminals: [{ id: 1 }] });
  });

  test('handles errors', async () => {
    const req = { query: {} };
    const res = mockRes();
    const err = new Error('fail');
    UexTerminal.findAll.mockRejectedValue(err);
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await searchTerminals(req, res);

    expect(spy).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Server error' });
    spy.mockRestore();
  });
});

describe('api/uex getTerminalInventory', () => {
  beforeEach(() => jest.clearAllMocks());

  test('returns 404 when terminal missing', async () => {
    const req = { params: { id: '1' } };
    const res = mockRes();
    UexTerminal.findByPk.mockResolvedValue(null);

    await getTerminalInventory(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Not found' });
  });

  test('returns inventory for terminal', async () => {
    const req = { params: { id: '1' } };
    const res = mockRes();
    UexTerminal.findByPk.mockResolvedValue({ id: 1 });
    UexItemPrice.findAll.mockResolvedValue(['i']);
    UexCommodityPrice.findAll.mockResolvedValue(['c']);
    UexFuelPrice.findAll.mockResolvedValue(['f']);
    UexVehiclePurchasePrice.findAll.mockResolvedValue(['pb']);
    UexVehicleRentalPrice.findAll.mockResolvedValue(['pr']);

    await getTerminalInventory(req, res);

    expect(res.json).toHaveBeenCalledWith({
      terminal: { id: 1 },
      inventory: {
        items: ['i'],
        commodities: ['c'],
        fuel: ['f'],
        vehicles_buy: ['pb'],
        vehicles_rent: ['pr']
      }
    });
  });

  test('handles errors', async () => {
    const req = { params: { id: '1' } };
    const res = mockRes();
    const err = new Error('fail');
    UexTerminal.findByPk.mockRejectedValue(err);
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await getTerminalInventory(req, res);

    expect(spy).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Server error' });
    spy.mockRestore();
  });
});

describe('api/uex getTerminalsForItem', () => {
  beforeEach(() => jest.clearAllMocks());

  test('aggregates terminals from all tables', async () => {
    const req = { params: { name: 'foo' } };
    const res = mockRes();
    UexItemPrice.findAll.mockResolvedValue([{ terminal: { id: 1 } }]);
    UexCommodityPrice.findAll.mockResolvedValue([{ terminal: { id: 2 } }]);
    UexVehiclePurchasePrice.findAll.mockResolvedValue([{ terminal: { id: 3 } }]);

    await getTerminalsForItem(req, res);

    expect(res.json).toHaveBeenCalledWith({ terminals: [{ id: 1 }, { id: 2 }, { id: 3 }] });
  });

  test('handles errors', async () => {
    const req = { params: { name: 'foo' } };
    const res = mockRes();
    UexItemPrice.findAll.mockRejectedValue(new Error('fail'));
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await getTerminalsForItem(req, res);

    expect(spy).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Server error' });
    spy.mockRestore();
  });
});
