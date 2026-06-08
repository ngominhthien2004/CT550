/**
 * populate-data.mjs
 * 
 * Populates empty MongoDB collections with realistic test data via the backend API.
 * 
 * Collections populated:
 *   chapters, readingprogresses, requestterms, requests,
 *   requestchatmessages, requestevents, illuwrlrequests, userblocks
 * 
 * Usage: node backend/scripts/populate-data.mjs
 */

// ─── Configuration ───────────────────────────────────────────────────────────

const API = 'http://localhost:5000/api';

const CREDENTIALS = {
    'johnny.brooks':     { email: 'johnny.brooks@gmail.com',     password: 'Test12345!' },
    'xiangxia.chen':     { email: 'xiangxia.chen@gmail.com',    password: 'Test12345!' },
    'goku.tanaka':       { email: 'goku.tanaka@gmail.com',      password: 'Test12345!' },
    'mariana.silva':     { email: 'mariana.silva@gmail.com',    password: 'Test12345!' },
    'mateo.hernandez':   { email: 'mateo.hernandez@gmail.com',  password: 'Test12345!' },
    'priya.sharma':      { email: 'priya.sharma@gmail.com',     password: 'Test12345!' },
    'yuki.sato':         { email: 'yuki.sato@gmail.com',        password: 'Test12345!' },
    'qa_admin_20260417': { email: 'qa_admin_20260417@example.com', password: 'QaAdmin!2026' },
};

// 1x1 white PNG as base64 (valid PNG used as placeholder image for novel artwork)
const PLACEHOLDER_PNG_BASE64 =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
}

function placeholderImageBlob() {
    const buf = Buffer.from(PLACEHOLDER_PNG_BASE64, 'base64');
    return new Blob([buf], { type: 'image/png' });
}

async function login(username) {
    const { email, password } = CREDENTIALS[username];
    if (!email) throw new Error(`Unknown user: ${username}`);
    const res = await fetch(`${API}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Login failed for ${username} (${res.status}): ${text}`);
    }
    const data = await res.json();
    return data.token;
}

/** Helper: handle fetch response, throw on non-2xx with server message */
async function check(res, label) {
    if (!res.ok) {
        let body = '';
        try { body = await res.text(); } catch { body = '(no body)'; }
        throw new Error(`[${label}] ${res.status}: ${body.slice(0, 300)}`);
    }
    return res.headers.get('content-type')?.includes('json')
        ? res.json()
        : res.text();
}

/** Create a placeholder image and return a FormData ready for artwork creation */
function artworkFormData(fields) {
    const fd = new FormData();
    fd.append('images', placeholderImageBlob(), 'placeholder.png');
    for (const [k, v] of Object.entries(fields)) {
        if (Array.isArray(v)) {
            fd.append(k, v.join(','));
        } else if (v !== undefined && v !== null) {
            fd.append(k, String(v));
        }
    }
    return fd;
}

function safeId(obj) {
    return obj?._id || obj?.id || obj;
}

// ─── Logging ─────────────────────────────────────────────────────────────────

const results = {};

function logResult(collection, action, status, detail = '') {
    if (!results[collection]) results[collection] = [];
    results[collection].push({ action, status, detail });
    const icon = status === 'OK' ? '✓' : '✗';
    console.log(`  ${icon} [${collection}] ${action} ${detail ? '— ' + detail : ''}`);
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
    console.log('━'.repeat(60));
    console.log('  Populating MongoDB collections with test data\n');

    // ── Step 1: Authenticate all users ────────────────────────────────────────
    console.log('── Step 1: Authenticating users ────────────────────────────────');
    const tokens = {};
    for (const username of Object.keys(CREDENTIALS)) {
        try {
            tokens[username] = await login(username);
            logResult('users', `Login ${username}`, 'OK');
        } catch (err) {
            logResult('users', `Login ${username}`, 'FAIL', err.message);
        }
        await sleep(100);
    }
    console.log();

    // ── Step 2: Create Novel with Chapters ────────────────────────────────────
    console.log('── Step 2: Create novel and chapters (johnny.brooks) ───────────');
    let novelId = null;
    let chapterIds = [];

    try {
        const token = tokens['johnny.brooks'];

        // Create novel artwork (with placeholder image via FormData)
        const fd = artworkFormData({
            title: 'The Last Sakura',
            description: 'A heartwarming tale of a young artist discovering the beauty of traditional Japanese painting in modern Tokyo.',
            type: 'novel',
            novelFormat: 'series',
            tags: 'story,drama,slice-of-life,japan,art',
            ageRating: 'all',
        });

        const artRes = await fetch(`${API}/artworks`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: fd,
        });

        const novelData = await check(artRes, 'Create artwork');
        novelId = safeId(novelData);
        logResult('artworks', 'Create novel "The Last Sakura"', 'OK', `id: ${novelId}`);

        // Create chapters
        const chapters = [
            {
                title: 'Prologue: A Chance Encounter',
                content: `The rain fell softly over Shinjuku as Yuki hurried through the crowded streets, her portfolio clutched tightly against her chest. She had just been rejected by yet another art school, and the weight of disappointment pressed heavily on her shoulders.

As she turned a corner, she nearly collided with an elderly man who was calmly painting under the cover of a small shop awning. His brush moved with a grace that seemed to defy the chaos around them.

"I'm so sorry!" Yuki exclaimed, bowing deeply.

The old man simply smiled, his eyes crinkling with warmth. "No need to apologize, young one. The rain brings us together in unexpected ways."

He gestured to his painting — a stunning depiction of a sakura tree in full bloom, each petal rendered with exquisite detail.

"It's beautiful," Yuki whispered, her artist's eye recognizing the mastery in every stroke.

"Would you like to learn?" the old man asked, and in that moment, Yuki's path changed forever.`,
            },
            {
                title: "Chapter 1: The Master's Studio",
                content: `The next day, Yuki found herself standing before a traditional machiya townhouse in the old part of Kyoto. The wooden facade was weathered but elegant, and a small sign reading "Tanaka Art Studio" hung beside the entrance.

She took a deep breath and slid open the door. The interior was filled with the scent of sumi ink and aged wood. Scrolls lined the walls, each one a masterpiece of traditional Japanese painting.

"Ah, you came," said the old man — Tanaka-sensei — appearing from behind a screen. "Good. I was hoping you would."

He led her to a small room overlooking a garden. "This will be your workspace. The first lesson is patience. Watch the garden for one hour, then paint what you feel."

Yuki sat by the window, watching as sunlight played across the moss-covered stones. A butterfly danced between flowers. The wind rustled through bamboo leaves.

When she finally picked up her brush, something had changed. The fear and self-doubt that had plagued her for years seemed to melt away. She painted not what she saw, but what she felt — and for the first time, her art felt truly alive.`,
            },
            {
                title: 'Chapter 2: Finding Your Voice',
                content: `Weeks passed, and Yuki's skills improved dramatically under Tanaka-sensei's guidance. But something was still missing.

"Your technique is flawless," Sensei said one afternoon, examining her latest work. "But where is Yuki in this painting?"

She stared at the piece — a perfectly executed landscape of Mount Fuji. It was beautiful, but it could have been painted by anyone.

"I don't understand," she said.

Tanaka-sensei smiled gently. "Art is not about perfection, Yuki. It is about expression. You have learned to paint like me, like the masters. But now you must learn to paint like yourself."

That night, Yuki walked through the illuminated streets of Gion. She watched geiko and maiko hurrying to their appointments, their elegant silhouettes flickering like shadows in the lantern light.

She returned to the studio and began to paint. Not a landscape, not a traditional subject, but the feeling of being a young woman in a city that bridged ancient and modern worlds.

When dawn broke, she stepped back to examine her work. For the first time, she saw herself in the painting.

"Ah," came Tanaka-sensei's voice from the doorway. "Now you are ready. Tomorrow we begin your true training."`,
            },
        ];

        for (const ch of chapters) {
            const chRes = await fetch(`${API}/artworks/${novelId}/chapters`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    title: ch.title,
                    content: ch.content,
                }),
            });
            const chData = await check(chRes, `Create chapter "${ch.title}"`);
            const chId = safeId(chData);
            chapterIds.push(chId);
            logResult('chapters', `Create chapter "${ch.title}"`, 'OK', `id: ${chId}`);
            await sleep(100);
        }
    } catch (err) {
        logResult('chapters', 'Create novel/chapters', 'FAIL', err.message);
    }
    console.log();

    // ── Step 3: Create Reading Progress (xiangxia.chen) ──────────────────────
    console.log('── Step 3: Reading progress (xiangxia.chen) ────────────────────');

    if (novelId && chapterIds.length >= 2) {
        try {
            const token = tokens['xiangxia.chen'];

            // Mark chapter 1 as 100% complete
            const prog1 = await fetch(`${API}/artworks/${novelId}/reading-progress`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    chapter: chapterIds[0],
                    progressPercent: 100,
                    scrollPosition: 0,
                }),
            });
            await check(prog1, 'Reading progress ch1');
            logResult('readingprogresses', 'Chapter 1 read 100%', 'OK');

            // Mark chapter 2 as 45% read
            const prog2 = await fetch(`${API}/artworks/${novelId}/reading-progress`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    chapter: chapterIds[1],
                    progressPercent: 45,
                    scrollPosition: 1200,
                }),
            });
            await check(prog2, 'Reading progress ch2');
            logResult('readingprogresses', 'Chapter 2 read 45%', 'OK');
        } catch (err) {
            logResult('readingprogresses', 'Save reading progress', 'FAIL', err.message);
        }
    } else {
        logResult('readingprogresses', 'Skip (no novel/chapters)', 'SKIP');
    }
    console.log();

    // ── Step 4: Create Request Terms (goku.tanaka) ────────────────────────────
    console.log('── Step 4: Create request terms (goku.tanaka) ──────────────────');
    let termIds = [];

    try {
        const token = tokens['goku.tanaka'];

        const term1Res = await fetch(`${API}/requests/terms`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                title: 'Character Illustration — Full Body',
                tier: 'standard',
                targetPrice: 50,
                currency: 'USD',
                acceptedWorkTypes: ['illust'],
                description: 'I will create a full-body character illustration with simple background. Includes 1 character, full colors, and 1 revision.',
                rules: 'Please provide reference images and detailed description of your character. Commercial use requires additional fee.',
                strengths: 'Specializing in fantasy character design with vibrant colors and dynamic poses. Experienced in D&D, anime, and original character art.',
                estimatedDays: 14,
                maxOpenRequests: 3,
                isOpen: true,
            }),
        });
        const term1 = await check(term1Res, 'Create term 1');
        termIds.push(safeId(term1));
        logResult('requestterms', 'Create "Character Illustration — Full Body"', 'OK', `id: ${termIds[0]}`);

        const term2Res = await fetch(`${API}/requests/terms`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                title: 'Chibi Portrait — Express',
                tier: 'basic',
                targetPrice: 25,
                currency: 'USD',
                acceptedWorkTypes: ['illust'],
                description: 'A cute chibi-style portrait of your character! Perfect for profile pictures and social media.',
                rules: 'Simple background only. 1 character. No complex armor or mecha designs.',
                strengths: 'Expert in cute and expressive chibi art with quick turnaround times.',
                estimatedDays: 14,
                maxOpenRequests: 5,
                isOpen: true,
            }),
        });
        const term2 = await check(term2Res, 'Create term 2');
        termIds.push(safeId(term2));
        logResult('requestterms', 'Create "Chibi Portrait — Express"', 'OK', `id: ${termIds[1]}`);
    } catch (err) {
        logResult('requestterms', 'Create terms', 'FAIL', err.message);
    }
    console.log();

    // ── Step 5: Create Commission Request (mariana.silva) ─────────────────────
    console.log('── Step 5: Create commission request (mariana.silva) ───────────');
    let requestId = null;
    let gokuUserId = null;

    try {
        // Search for goku.tanaka user ID
        const searchRes = await fetch(`${API}/users/search?q=goku.tanaka`, {
            headers: { Authorization: `Bearer ${tokens['mariana.silva']}` },
        });
        const searchData = await check(searchRes, 'Search goku.tanaka');
        if (!searchData.users || searchData.users.length === 0) {
            throw new Error('goku.tanaka not found via search');
        }
        gokuUserId = safeId(searchData.users[0]);
        logResult('users', 'Found goku.tanaka', 'OK', `id: ${gokuUserId}`);

        // Get goku's terms
        const termsRes = await fetch(`${API}/requests/terms?creator=${gokuUserId}&openOnly=false`, {
            headers: { Authorization: `Bearer ${tokens['mariana.silva']}` },
        });
        const termsData = await check(termsRes, 'Get goku terms');
        if (!termsData || termsData.length === 0) {
            throw new Error('No terms found for goku.tanaka');
        }
        const targetTermId = safeId(termsData[0]);
        logResult('requestterms', 'Found goku term', 'OK', `id: ${targetTermId}`);

        // Create request (POST with JSON body — multer passes through for non-multipart)
        const reqRes = await fetch(`${API}/requests`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${tokens['mariana.silva']}`,
            },
            body: JSON.stringify({
                termId: targetTermId,
                title: 'Fantasy Elf Character Design',
                description: 'I would like a full-body illustration of my elven ranger character from our D&D campaign. She has long silver hair, emerald green eyes, and wears a forest-green cloak. She carries a bow carved from ancient oak. Please include her wolf companion in the illustration.',
                workType: 'illust',
                proposedAmount: 50,
                visibility: 'private',
            }),
        });
        const reqData = await check(reqRes, 'Create request');
        requestId = safeId(reqData);
        logResult('requests', 'Create "Fantasy Elf Character Design"', 'OK', `id: ${requestId}`);
    } catch (err) {
        logResult('requests', 'Create commission request', 'FAIL', err.message);
    }
    console.log();

    // ── Step 6: Chat messages in request room ─────────────────────────────────
    console.log('── Step 6: Request chat messages ───────────────────────────────');

    if (requestId) {
        try {
            // mariana.silva (requester) sends the first message
            const msg1 = await fetch(`${API}/requests/${requestId}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${tokens['mariana.silva']}`,
                },
                body: JSON.stringify({
                    content: "Hi! I love your character concept! The elven ranger with a wolf companion sounds amazing. I have some ideas for the composition — would you like the wolf to be sitting beside her or in a more dynamic pose?",
                }),
            });
            await check(msg1, 'Chat message 1');
            logResult('requestchatmessages', 'mariana.silva sends first message', 'OK');

            // goku.tanaka (creator) replies
            const msg2 = await fetch(`${API}/requests/${requestId}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${tokens['goku.tanaka']}`,
                },
                body: JSON.stringify({
                    content: "Great ideas! I'll sketch out a few composition options and share them with you. The glowing bow will look really nice against the forest backdrop. I'll start working on it this weekend!",
                }),
            });
            await check(msg2, 'Chat message 2');
            logResult('requestchatmessages', 'goku.tanaka replies', 'OK');

            // mariana.silva responds back
            const msg3 = await fetch(`${API}/requests/${requestId}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${tokens['mariana.silva']}`,
                },
                body: JSON.stringify({
                    content: "I think a dynamic pose would be great! Maybe they are walking together through the forest, with her hand resting on the wolf's back. Also, could we add some magical glowing elements to her bow?",
                }),
            });
            await check(msg3, 'Chat message 3');
            logResult('requestchatmessages', 'mariana.silva sends follow-up', 'OK');
        } catch (err) {
            logResult('requestchatmessages', 'Send chat messages', 'FAIL', err.message);
        }
    } else {
        logResult('requestchatmessages', 'Skip (no request)', 'SKIP');
    }
    console.log();

    // ── Step 7: Accept Request (goku.tanaka) ──────────────────────────────────
    console.log('── Step 7: Accept request (goku.tanaka) ────────────────────────');

    if (requestId) {
        try {
            const accRes = await fetch(`${API}/requests/${requestId}/accept`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${tokens['goku.tanaka']}` },
            });
            await check(accRes, 'Accept request');
            logResult('requests', 'Accept request', 'OK');
            logResult('requestevents', 'Request accepted event', 'OK');
        } catch (err) {
            logResult('requestevents', 'Accept request', 'FAIL', err.message);
        }
    } else {
        logResult('requestevents', 'Skip (no request)', 'SKIP');
    }
    console.log();

    // ── Step 8: IlluWrl Request (yuki.sato → goku.tanaka) ────────────────────
    console.log('── Step 8: Create IlluWrl request (yuki.sato → goku.tanaka) ────');

    if (gokuUserId) {
        try {
            const illRes = await fetch(`${API}/users/${gokuUserId}/illuwrl-request`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${tokens['yuki.sato']}`,
                },
                body: JSON.stringify({
                    message: "Hi! I really love your art style, especially the way you use colors. I'm a writer and I'd love to collaborate on a project together. Let me know if you're interested!",
                }),
            });
            await check(illRes, 'IlluWrl request');
            logResult('illuwrlrequests', 'yuki.sato → goku.tanaka', 'OK');
        } catch (err) {
            logResult('illuwrlrequests', 'Create IlluWrl request', 'FAIL', err.message);
        }
    } else {
        logResult('illuwrlrequests', 'Skip (no goku userId)', 'SKIP');
    }
    console.log();

    // ── Step 9: Block User (priya.sharma blocks someone) ──────────────────────
    console.log('── Step 9: Block a user (priya.sharma) ─────────────────────────');

    try {
        // Search for another user to block (e.g., xiangxia.chen)
        const searchRes = await fetch(`${API}/users/search?q=xiangxia.chen`, {
            headers: { Authorization: `Bearer ${tokens['priya.sharma']}` },
        });
        const searchData = await check(searchRes, 'Search user to block');
        if (searchData.users && searchData.users.length > 0) {
            const blockUserId = safeId(searchData.users[0]);
            const blockRes = await fetch(`${API}/users/${blockUserId}/block`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${tokens['priya.sharma']}` },
            });
            await check(blockRes, 'Block user');
            logResult('userblocks', `priya.sharma blocked xiangxia.chen (${blockUserId})`, 'OK');
        } else {
            throw new Error('No user found to block');
        }
    } catch (err) {
        logResult('userblocks', 'Block user', 'FAIL', err.message);
    }
    console.log();

    // ── Summary ───────────────────────────────────────────────────────────────
    console.log('━'.repeat(60));
    console.log('  Population Summary\n');

    const collectionMap = {
        chapters: 'chapters',
        readingprogresses: 'readingprogresses',
        requestterms: 'requestterms',
        requests: 'requests',
        requestchatmessages: 'requestchatmessages',
        requestevents: 'requestevents',
        illuwrlrequests: 'illuwrlrequests',
        userblocks: 'userblocks',
    };

    let totalOk = 0;
    let totalFail = 0;

    for (const [col, label] of Object.entries(collectionMap)) {
        const entries = results[col] || [];
        const ok = entries.filter((e) => e.status === 'OK').length;
        const fail = entries.filter((e) => e.status === 'FAIL').length;
        const skip = entries.filter((e) => e.status === 'SKIP').length;
        totalOk += ok;
        totalFail += fail;

        const parts = [];
        if (ok) parts.push(`${ok} ok`);
        if (fail) parts.push(`${fail} fail`);
        if (skip) parts.push(`${skip} skip`);

        console.log(`  ${label.padEnd(20)} ${parts.join(', ') || 'no actions'}`);
    }

    console.log(`\n  Total: ${totalOk} succeeded, ${totalFail} failed`);
    console.log('━'.repeat(60));
}

main().catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
});
