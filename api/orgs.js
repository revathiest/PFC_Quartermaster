const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const { OrgTag } = require('../config/database');

async function listOrgs(req, res) {
  try {
    const tags = await OrgTag.findAll();
    const base = 'https://api.starcitizen-api.com/77210b95720bd50b3584ead32936dfd4/v1/';
    const orgEndpoint = `${base}live/organization/`;

    const orgs = [];
    for (const tag of tags) {
      try {
        const url = `${orgEndpoint}${tag.rsiOrgId.toUpperCase()}`;
        const text = await fetch(url).then(r => r.text());
        const data = JSON.parse(text);
        if (data?.data) orgs.push(data.data);
      } catch (err) {
        console.error('Failed to fetch org', tag.rsiOrgId, err);
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
    const base = 'https://api.starcitizen-api.com/77210b95720bd50b3584ead32936dfd4/v1/';
    const url = `${base}live/organization/${sid.toUpperCase()}`;
    const text = await fetch(url).then(r => r.text());
    const data = JSON.parse(text);
    if (!data?.data) return res.status(404).json({ error: 'Not found' });
    res.json({ org: data.data });
  } catch (err) {
    console.error('Failed to fetch org', sid, err);
    res.status(500).json({ error: 'Server error' });
  }
}

router.get('/:sid', getOrg);

module.exports = { router, listOrgs, getOrg };
