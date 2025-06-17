const express = require('express');
const router = express.Router();
const { OrgTag, Org } = require('../config/database');

async function listOrgs(req, res) {
  try {
    const tags = await OrgTag.findAll();
    const orgs = [];
    for (const tag of tags) {
      try {
        const record = await Org.findByPk(tag.rsiOrgId.toUpperCase());
        if (record?.data) {
          orgs.push(JSON.parse(record.data));
        }
      } catch (err) {
        console.error('Failed to load org', tag.rsiOrgId, err);
      }
    }

    res.json({ orgs });
  } catch (err) {
    console.error('Failed to load orgs:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

router.get('/', listOrgs);

async function getOrg(req, res) {
  const { sid } = req.params;
  try {
    const record = await Org.findByPk(sid.toUpperCase());
    if (!record) return res.status(404).json({ error: 'Not found' });
    const data = JSON.parse(record.data);
    res.json({ org: data });
  } catch (err) {
    console.error('Failed to load org', sid, err);
    res.status(500).json({ error: 'Server error' });
  }
}

router.get('/:sid', getOrg);

module.exports = { router, listOrgs, getOrg };
