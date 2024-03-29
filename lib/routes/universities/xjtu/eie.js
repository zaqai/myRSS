const url = require('url');
const got = require('@/utils/got');
const cheerio = require('cheerio');

module.exports = async (ctx) => {
    const rootUrl = 'http://eie.xjtu.edu.cn/jyxx.htm';
    const response = await got({
        method: 'get',
        url: rootUrl,
    });
    const $ = cheerio.load(response.data);
    const list = $('div.list_rlb ul li')
        .slice(0, 10)
        .map((_, item) => {
            item = $(item);
            const a = item.find('a');
            return {
                title: a.text(),
                link: url.resolve('http://eie.xjtu.edu.cn/', a.attr('href')),
                pubDate: new Date(item.find('span').text()).toUTCString(),
            };
        })
        .get();

    ctx.state.data = {
        title: '西安交通大学电信学部 - 就业信息',
        link: rootUrl,
        item: await Promise.all(
            list.map((item) =>
                ctx.cache.tryGet(item.link, async () => {
                    const res = await got({ method: 'get', url: item.link });
                    const content = cheerio.load(res.data);
                    item.description = content('#vsb_content').html();
                    return item;
                })
            )
        ),
    };
};
