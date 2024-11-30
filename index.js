const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs').promises;

async function crawlFirstLayer(url) {
    try {
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);
        const urlGroups = [];

        $('a').each((index, element) => {
            const href = $(element).attr('href');
            if (href && href.includes('weekly-issue')) {
                urlGroups.push(href);
            }
        });

        for (const firstUrl of urlGroups) {
            const markdownData = [];
            const secondLayerContent = await crawlSecondLayer(firstUrl);

            markdownData.push(`# ${firstUrl}`);
            markdownData.push('');

            markdownData.push(...secondLayerContent);

            const fileName = generateFileName(firstUrl);
            await fs.writeFile(fileName, markdownData.join('\n'), 'utf8');
            console.log(`保存 Markdown 文件: ${fileName}`);
        }
    } catch (error) {
        console.error(`抓取第一层页面失败: ${url}`, error.message);
    }
}

async function crawlSecondLayer(url) {
    try {
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);
        const content = [];

        $('h2, a').each((index, element) => {
            if ($(element).is('h2')) {
                content.push(`## ${$(element).text()}`);
            } else if ($(element).is('a')) {
                const href = $(element).attr('href');
                const text = $(element).text();
                if (href && !href.includes('#comment') && !href.includes('ruanyifeng.com') && !href.includes('ruanyf')) {
                    content.push(`- [${text}](${href})`);
                }
            }
        });

        return content;
    } catch (error) {
        console.error(`抓取第二层页面失败: ${url}`, error.message);
        return [];
    }
}

function generateFileName(url) {
    const urlParts = url.split('/');
    const fileName = urlParts[urlParts.length - 1] || 'index';
    return `${fileName}.md`;
}

// 启动爬虫
const startUrl = 'https://www.ruanyifeng.com/blog/weekly/';
crawlFirstLayer(startUrl);