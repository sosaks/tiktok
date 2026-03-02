// ===== TikSave - TikTok Video Downloader =====

const API_BASE = 'https://tikwm.com';

// DOM Elements
const urlInput = document.getElementById('urlInput');
const downloadBtn = document.getElementById('downloadBtn');
const pasteBtn = document.getElementById('pasteBtn');
const errorMsg = document.getElementById('errorMsg');
const resultCard = document.getElementById('resultCard');
const btnLoader = document.getElementById('btnLoader');

// Download links
const dlNoWatermark = document.getElementById('dlNoWatermark');
const dlWithWatermark = document.getElementById('dlWithWatermark');
const dlAudio = document.getElementById('dlAudio');

// Video info elements
const thumbnail = document.getElementById('thumbnail');
const videoTitle = document.getElementById('videoTitle');
const videoAuthor = document.getElementById('videoAuthor');
const videoDuration = document.getElementById('videoDuration');
const videoPlays = document.getElementById('videoPlays');
const videoLikes = document.getElementById('videoLikes');

// ===== Event Listeners =====

downloadBtn.addEventListener('click', handleDownload);

urlInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleDownload();
});

urlInput.addEventListener('input', () => {
    hideError();
});

pasteBtn.addEventListener('click', async () => {
    try {
        const text = await navigator.clipboard.readText();
        urlInput.value = text;
        urlInput.focus();
        hideError();
    } catch {
        // Fallback: focus input so user can paste manually
        urlInput.focus();
        showError('クリップボードへのアクセスが許可されていません。手動で貼り付けてください。');
    }
});

// ===== Main Download Handler =====

async function handleDownload() {
    const url = urlInput.value.trim();

    // Validate URL
    if (!url) {
        showError('URLを入力してください');
        urlInput.focus();
        return;
    }

    if (!isValidTikTokUrl(url)) {
        showError('有効なTikTokのURLを入力してください');
        return;
    }

    // Show loading state
    setLoading(true);
    hideError();
    hideResult();

    try {
        const data = await fetchVideoData(url);

        if (!data || data.code !== 0) {
            throw new Error(data?.msg || '動画の取得に失敗しました');
        }

        displayResult(data.data);
    } catch (error) {
        console.error('Error:', error);
        showError(error.message || '動画の取得中にエラーが発生しました。URLを確認してもう一度お試しください。');
    } finally {
        setLoading(false);
    }
}

// ===== API Call =====

async function fetchVideoData(url) {
    const response = await fetch(`${API_BASE}/api/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            url: url,
            hd: 1,
        }),
    });

    if (!response.ok) {
        throw new Error('サーバーへの接続に失敗しました');
    }

    return await response.json();
}

// ===== Display Result =====

function displayResult(data) {
    // Thumbnail
    thumbnail.src = data.cover || data.origin_cover || '';
    thumbnail.alt = data.title || '動画サムネイル';

    // Video info
    videoTitle.textContent = data.title || '(タイトルなし)';
    videoAuthor.textContent = `@${data.author?.unique_id || data.author?.nickname || 'unknown'}`;

    // Duration
    const dur = data.duration || 0;
    const mins = Math.floor(dur / 60);
    const secs = dur % 60;
    videoDuration.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;

    // Stats
    videoPlays.querySelector('span').textContent = formatNumber(data.play_count || 0);
    videoLikes.querySelector('span').textContent = formatNumber(data.digg_count || 0);

    // Download links - use tikwm proxy URLs
    const noWmUrl = data.hdplay || data.play || '';
    const wmUrl = data.wmplay || '';
    const audioUrl = data.music || '';

    dlNoWatermark.href = noWmUrl;
    dlNoWatermark.style.display = noWmUrl ? 'flex' : 'none';
    dlNoWatermark.onclick = (e) => {
        e.preventDefault();
        downloadFile(noWmUrl, 'tiktok_video.mp4');
    };

    dlWithWatermark.href = wmUrl;
    dlWithWatermark.style.display = wmUrl ? 'flex' : 'none';
    dlWithWatermark.onclick = (e) => {
        e.preventDefault();
        downloadFile(wmUrl, 'tiktok_video_wm.mp4');
    };

    dlAudio.href = audioUrl;
    dlAudio.style.display = audioUrl ? 'flex' : 'none';
    dlAudio.onclick = (e) => {
        e.preventDefault();
        downloadFile(audioUrl, 'tiktok_audio.mp3');
    };

    // Show result card
    showResult();
}

// ===== File Download =====

function downloadFile(url, filename) {
    // Open in new tab - the tikwm URLs will trigger download
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    // Try using download attribute, but for cross-origin it may open in new tab
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

// ===== URL Validation =====

function isValidTikTokUrl(url) {
    const patterns = [
        /tiktok\.com/i,
        /vm\.tiktok\.com/i,
        /vt\.tiktok\.com/i,
        /tiktok\.com\/@[\w.]+\/video\/\d+/i,
    ];
    return patterns.some(pattern => pattern.test(url));
}

// ===== UI Helpers =====

function setLoading(loading) {
    downloadBtn.disabled = loading;
    downloadBtn.classList.toggle('loading', loading);
}

function showError(msg) {
    errorMsg.textContent = msg;
    errorMsg.classList.add('show');
}

function hideError() {
    errorMsg.classList.remove('show');
}

function showResult() {
    resultCard.classList.add('show');
    // Smooth scroll to result
    setTimeout(() => {
        resultCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
}

function hideResult() {
    resultCard.classList.remove('show');
}

function formatNumber(num) {
    if (num >= 1_000_000) {
        return (num / 1_000_000).toFixed(1) + 'M';
    }
    if (num >= 1_000) {
        return (num / 1_000).toFixed(1) + 'K';
    }
    return num.toString();
}

// ===== Floating Particles (Background Decoration) =====

function createParticles() {
    const container = document.getElementById('particles');
    const count = window.innerWidth < 640 ? 8 : 15;

    for (let i = 0; i < count; i++) {
        const particle = document.createElement('div');
        const size = Math.random() * 3 + 1;
        const isAccent = Math.random() > 0.5;

        Object.assign(particle.style, {
            position: 'absolute',
            width: size + 'px',
            height: size + 'px',
            background: isAccent ? 'rgba(254, 44, 85, 0.3)' : 'rgba(37, 244, 238, 0.25)',
            borderRadius: '50%',
            left: Math.random() * 100 + '%',
            top: Math.random() * 100 + '%',
            animation: `particleFloat ${10 + Math.random() * 20}s linear infinite`,
            animationDelay: -Math.random() * 20 + 's',
            filter: `blur(${Math.random() * 1}px)`,
        });

        container.appendChild(particle);
    }
}

// Add particle animation
const particleStyle = document.createElement('style');
particleStyle.textContent = `
    @keyframes particleFloat {
        0% { transform: translateY(0) translateX(0); opacity: 0; }
        10% { opacity: 1; }
        90% { opacity: 1; }
        100% { transform: translateY(-100vh) translateX(${Math.random() * 100 - 50}px); opacity: 0; }
    }
`;
document.head.appendChild(particleStyle);

// Init particles
createParticles();
