const { fetchSCDataByUrl } = require('../../utils/fetchSCData');
const {
  GalactapediaDetail,
  GalactapediaTag,
  GalactapediaProperty,
  GalactapediaRelatedArticle
} = require('../../config/database');

async function syncGalactapediaDetail(entry) {
  const { api_url, id } = entry;

  try {
    const result = await fetchSCDataByUrl(api_url);
    const data = result?.data;

    if (!data || !data.translations?.en_EN) {
      throw new Error(`No detail content for ${id}`);
    }

    // Save main article body
    await GalactapediaDetail.upsert({
      id: data.id,
      content: data.translations.en_EN,
      created_at: data.created_at,
      updated_at: new Date()
    });

    // Clear and repopulate tags
    await GalactapediaTag.destroy({ where: { article_id: id } });
    const tags = (data.tags || []).map(tag => ({
      article_id: id,
      tag_id: tag.id,
      tag_name: tag.name
    }));
    if (tags.length) await GalactapediaTag.bulkCreate(tags);

    // Clear and repopulate properties
    await GalactapediaProperty.destroy({ where: { article_id: id } });
    const props = (data.properties || []).map(prop => ({
      article_id: id,
      name: prop.name,
      value: prop.value
    }));
    if (props.length) await GalactapediaProperty.bulkCreate(props);

    // Clear and repopulate related articles
    await GalactapediaRelatedArticle.destroy({ where: { article_id: id } });
    const related = (data.related_articles || []).map(article => ({
      article_id: id,
      related_id: article.id,
      title: article.title,
      url: article.url,
      api_url: article.api_url
    }));
    if (related.length) await GalactapediaRelatedArticle.bulkCreate(related);

    console.log(`[SYNC] Updated Galactapedia details for ${id} - ${data.title}`);
    return true;
  } catch (err) {
    console.error(`[SYNC ERROR] Failed to sync galactapedia detail for ${id}:`, err);
    return false;
  }
}

module.exports = { syncGalactapediaDetail };
