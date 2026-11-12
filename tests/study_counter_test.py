"""Run with python3 tests/study_counter_test.py against the running preview."""
import asyncio
import json
from playwright.async_api import async_playwright, expect


async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={"width": 393, "height": 807})
        await page.goto('http://localhost:8080')
        words = [dict(id=i, korean=term, uzbek=back, romanization='', createdAt=1)
                 for i, term, back in [(1, '하나', 'one'), (2, '둘', 'two'), (3, '셋', 'three')]]
        await page.evaluate('''sets => {
            localStorage.setItem('korean-vocab-sets', JSON.stringify(sets));
            localStorage.setItem('study-sessions', '[]');
        }''', [dict(id='counter-check', name='Counter check', words=words, createdAt=1)])
        await page.goto('http://localhost:8080/study/counter-check')
        for position in range(1, 4):
            await expect(page.locator('header')).to_contain_text(f'{position} | 3')
            await page.get_by_role('button', name='Show Answer').click()
            await page.get_by_role('button', name='GOOD').click()
        await page.wait_for_url('http://localhost:8080/')
        sessions = json.loads(await page.evaluate("localStorage.getItem('study-sessions')"))
        assert sessions[0]['cards'] == 3, sessions
        sets = json.loads(await page.evaluate("localStorage.getItem('korean-vocab-sets')"))
        assert sum(w.get('state') == 'review' for w in sets[0]['words']) == 3
        print('PASS: counter advances 1/3 → 2/3 → 3/3; exactly three answers saved.')
        await browser.close()


asyncio.run(main())