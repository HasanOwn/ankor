"""Run with python3 tests/word_browser_regression_test.py against the preview.

Uses isolated browser storage; live categorization calls the existing app service.
"""
import asyncio
import json
from pathlib import Path
from playwright.async_api import async_playwright, expect


ORIGIN = 'http://localhost:8080'
SHOTS = Path('/tmp/browser/ankor-ui')


async def main():
    SHOTS.mkdir(parents=True, exist_ok=True)
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={'width': 1280, 'height': 1800})
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        await page.goto(ORIGIN)
        words = [dict(id=i, korean=term, uzbek=back, romanization=roman,
                      createdAt=i, state='review', interval=4, ease=2.6,
                      due=9999999999999, lapses=2, isKnown=True)
                 for i, term, back, roman in [(1, '계획하다', 'rejalashtirmoq', 'gyehoekhada'),
                                              (2, '사과', 'olma', 'sagwa'),
                                              (3, '물', 'suv', 'mul')]]
        sets = [dict(id='ui-check', name='Vocab 1', language='ko-KR', words=words, createdAt=1),
                dict(id='second', name='Vocab 2', words=[], createdAt=2)]
        await page.evaluate('''sets => {
            localStorage.setItem('korean-vocab-sets', JSON.stringify(sets));
            localStorage.setItem('ankor-theme', 'dark');
        }''', sets)
        await page.goto(f'{ORIGIN}/browser')
        await page.get_by_role('combobox').first.click()
        await page.get_by_role('option', name='Vocab 1', exact=True).click()
        await page.get_by_role('combobox').nth(1).click()
        await page.get_by_role('option', name='Review', exact=True).click()
        row = page.locator('main li').filter(has_text='계획하다')
        await row.get_by_text('계획하다', exact=True).click()
        await expect(page.get_by_role('dialog')).to_have_count(0)
        await row.get_by_text('rejalashtirmoq', exact=True).click()
        await expect(page.get_by_role('dialog')).to_have_count(0)
        await row.get_by_role('button', name='Edit 계획하다').click()
        await expect(page.get_by_role('dialog')).to_be_visible()
        await page.locator('#translation').fill('plan')
        await page.get_by_role('button', name='Update Word').click()
        await expect(row).to_contain_text('plan')
        saved = json.loads(await page.evaluate("localStorage.getItem('korean-vocab-sets')"))
        edited = next(w for w in saved[0]['words'] if w['id'] == 1)
        for key in ['state', 'interval', 'ease', 'due', 'lapses', 'isKnown']:
            assert edited[key] == words[0][key], (key, edited)
        await page.screenshot(path=str(SHOTS / 'browser-desktop-dark.png'))
        await page.goto(f'{ORIGIN}/settings')
        await page.goto(f'{ORIGIN}/browser')
        await expect(page.get_by_role('combobox').first).to_contain_text('Vocab 1')
        await expect(page.get_by_role('combobox').nth(1)).to_contain_text('Review')
        await page.get_by_placeholder('Search all cards…').fill('plan')
        await expect(page.locator('main li')).to_have_count(1)
        await page.get_by_role('button', name='Clear search').click()
        await expect(page.locator('main li')).to_have_count(3)
        await page.set_viewport_size({'width': 393, 'height': 852})
        await page.wait_for_timeout(800)
        await page.screenshot(path=str(SHOTS / 'browser-mobile-dark.png'))
        await page.goto(f'{ORIGIN}/words/ui-check')
        await page.get_by_role('button', name='Pronounce').first.click()
        await expect(page.get_by_role('dialog')).to_have_count(0)
        await page.get_by_role('button', name='Edit', exact=True).first.click()
        await page.locator('#translation').fill('water')
        await page.get_by_role('button', name='Update Word').click()
        await expect(page.get_by_text('water', exact=True)).to_be_visible()
        await page.get_by_placeholder('Search words...').fill('계획')
        await expect(page.get_by_text('계획하다', exact=True)).to_be_visible()
        await page.get_by_placeholder('Search words...').fill('')
        await page.get_by_role('button', name='Add Word').click()
        await page.locator('#term').fill('책')
        await page.locator('#translation').fill('book')
        await page.get_by_role('button', name='Add Word', exact=True).last.click()
        await expect(page.get_by_text('책', exact=True)).to_be_visible()
        await page.get_by_role('button', name='Delete', exact=True).first.click()
        await page.get_by_role('alertdialog').get_by_role('button', name='Delete', exact=True).click()
        await expect(page.get_by_text('책', exact=True)).to_have_count(0)
        await page.screenshot(path=str(SHOTS / 'wordlist-mobile-dark.png'))

        # Exercise the real categorization service through the user's button.
        async with page.expect_response(lambda r: '/functions/v1/categorize-words' in r.url and r.request.method == 'POST', timeout=90000) as response_info:
            await page.get_by_role('button', name='Categorize with AI', exact=True).click()
        response = await response_info.value
        result = await response.json()
        if response.ok and result.get('assignments'):
            await expect(page.get_by_role('button', name='Clear categories')).to_be_visible()
            saved = json.loads(await page.evaluate("localStorage.getItem('korean-vocab-sets')"))
            assert all(w.get('category') for w in saved[0]['words'])
            print('PASS: live AI assignments saved and category sections visible.')
        else:
            print('LIVE AI ISSUE:', response.status, result.get('error', 'No assignments returned'))

        await page.get_by_role('button', name='Back to decks').click()
        await expect(page).to_have_url(f'{ORIGIN}/')
        await page.goto(f'{ORIGIN}/settings')
        await page.get_by_text('Auto voice', exact=True).locator('..').locator('..').get_by_role('switch').check()
        assert await page.evaluate("localStorage.getItem('ankor-auto-voice')") == 'true'
        # Record speech calls in place of requiring a device voice in headless Chromium.
        await page.evaluate('''() => {
            window.voiceCalls = [];
            window.speechSynthesis.speak = u => window.voiceCalls.push({text:u.text, lang:u.lang});
        }''')
        await page.locator('nav button').first.click()
        await page.get_by_role('button', name='Vocab 1', exact=False).first.click()
        await page.get_by_role('button', name='Study', exact=True).first.click()
        await expect(page.get_by_role('button', name='Show Answer')).to_be_visible()
        await page.wait_for_function('window.voiceCalls.length === 1')
        assert (await page.evaluate('window.voiceCalls[0].lang')) == 'ko-KR'
        await page.get_by_role('button', name='Show Answer').click()
        await page.get_by_role('button', name='GOOD').click()
        await page.wait_for_function('window.voiceCalls.length === 2')
        await page.get_by_role('button', name='Auto voice', exact=True).click()
        await page.get_by_role('button', name='Show Answer').click()
        await page.get_by_role('button', name='GOOD').click()
        assert await page.evaluate('window.voiceCalls.length') == 2
        await page.goto(f'{ORIGIN}/words/missing')
        await expect(page.get_by_text('Set not found')).to_be_visible()
        await page.goto(f'{ORIGIN}/browser')
        await page.evaluate("localStorage.setItem('ankor-theme','light')")
        await page.reload()
        await page.wait_for_timeout(800)
        await page.screenshot(path=str(SHOTS / 'browser-mobile-light.png'))
        assert not errors, errors
        print('PASS: pencil-only editing, metadata preservation, filters, Word List CRUD/navigation, auto-voice on/off, and missing-deck handling; no runtime errors.')
        await browser.close()


asyncio.run(main())