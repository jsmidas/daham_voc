const puppeteer = require('puppeteer');
const path = require('path');

async function generateFeatureGraphic() {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    // 뷰포트 설정 (1024 x 500)
    await page.setViewport({ width: 1024, height: 500 });

    // HTML 파일 로드
    const htmlPath = path.join(__dirname, 'mobile', 'assets', 'feature-graphic.html');
    await page.goto(`file://${htmlPath}`);

    // PNG로 저장
    const outputPath = path.join(__dirname, 'mobile', 'assets', 'feature-graphic.png');
    await page.screenshot({
        path: outputPath,
        type: 'png',
        clip: { x: 0, y: 0, width: 1024, height: 500 }
    });

    console.log(`Feature graphic saved to: ${outputPath}`);
    console.log('Size: 1024 x 500 pixels');

    await browser.close();
}

generateFeatureGraphic().catch(console.error);
