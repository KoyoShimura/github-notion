// sync_script.js
const { Client } = require("@notionhq/client");
const fs = require('fs');

const NOTION_KEY = process.env.NOTION_KEY;
const PAGE_ID = process.env.PAGE_ID;

const LAST_EDITED_FILE = 'last_edited_time.txt';
const OUTPUT_FILE = 'notion_content.md';
const notion = new Client({ auth: NOTION_KEY });

// ★★★ ここにNotionのブロックをMarkdownに変換するロジックを実装 ★★★
function convertBlocksToMarkdown(blocks, title) {
    let markdown = `# ${title}\n\n`;
    
    // この部分は、Notionのブロックを読みやすいMarkdown形式に変換するための
    // 複雑な処理が必要です。今回は単純なテキストとして出力する最低限のコードです。
    blocks.results.forEach(block => {
        const type = block.type;
        const text = block[type]?.rich_text?.[0]?.plain_text || '';
        if (text) {
             if (type.startsWith('heading')) markdown += `${'#'.repeat(parseInt(type.slice(-1)))} ${text}\n\n`;
             else if (type === 'paragraph') markdown += `${text}\n\n`;
             else if (type === 'bulleted_list_item') markdown += `* ${text}\n`;
             // ...必要に応じて他のブロックタイプ（コード、画像など）の処理を追加
        }
    });

    return markdown;
}
// ★★★ ロジック実装エリア終了 ★★★

async function syncNotionContent() {
    const page = await notion.pages.retrieve({ page_id: PAGE_ID });
    const currentLastEditedTime = page.last_edited_time;
    const title = page.properties.title?.title?.[0]?.plain_text || 'Untitled Page';
    
    let lastCheckedTime = '';
    try {
        lastCheckedTime = fs.readFileSync(LAST_EDITED_FILE, 'utf8').trim();
    } catch (e) {
        console.log('Performing initial sync.');
    }

    if (currentLastEditedTime === lastCheckedTime) {
        console.log('Notion content has not changed.');
        return; 
    }

    console.log('Content changed! Starting retrieval.');

    const blocks = await notion.blocks.children.list({ block_id: PAGE_ID });
    const content = convertBlocksToMarkdown(blocks, title);
    
    fs.writeFileSync(OUTPUT_FILE, content);
    fs.writeFileSync(LAST_EDITED_FILE, currentLastEditedTime);
    
    console.log(`Successfully synced content to ${OUTPUT_FILE} and updated ${LAST_EDITED_FILE}`);
}

syncNotionContent().catch(error => {
    console.error('An error occurred during sync:', error.message);
    process.exit(1);
});
