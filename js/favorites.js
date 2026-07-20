// 收藏功能模块

const FAVORITES_KEY = 'tanhax_favorites';
const MAX_FAVORITES = 100;

// 获取收藏列表
function getFavorites() {
    try {
        const data = localStorage.getItem(FAVORITES_KEY);
        return data ? JSON.parse(data) : [];
    } catch (e) {
        return [];
    }
}

// 保存收藏列表
function saveFavorites(favorites) {
    try {
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    } catch (e) {
        if (favorites.length > 20) {
            // localStorage 可能已满，只保留最近的 20 条
            localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites.slice(0, 20)));
        }
    }
}

// 添加收藏
function addFavorite(item) {
    if (!item || !item.vod_id) {
        showToast('无法收藏：缺少必要信息', 'error');
        return false;
    }

    const favorites = getFavorites();
    const key = `${item.source_code || ''}_${item.vod_id}`;
    const exists = favorites.find(f => {
        const fKey = `${f.source_code || ''}_${f.vod_id}`;
        return fKey === key;
    });

    if (exists) {
        showToast('该视频已在收藏列表中', 'info');
        return false;
    }

    if (favorites.length >= MAX_FAVORITES) {
        favorites.shift(); // 移除最早的收藏
    }

    favorites.push({
        vod_id: item.vod_id,
        vod_name: item.vod_name || '未知视频',
        vod_pic: item.vod_pic || '',
        vod_year: item.vod_year || '',
        type_name: item.type_name || '',
        vod_remarks: item.vod_remarks || '',
        source_code: item.source_code || '',
        source_name: item.source_name || '',
        api_url: item.api_url || '',
        timestamp: Date.now()
    });

    saveFavorites(favorites);
    updateFavoriteBadge();
    showToast('已添加到收藏', 'success');
    return true;
}

// 移除收藏
function removeFavorite(vodId, sourceCode) {
    const favorites = getFavorites();
    const newFavorites = favorites.filter(f => {
        const fKey = `${f.source_code || ''}_${f.vod_id}`;
        const key = `${sourceCode || ''}_${vodId}`;
        return fKey !== key;
    });

    if (newFavorites.length === favorites.length) {
        return false;
    }

    saveFavorites(newFavorites);
    updateFavoriteBadge();
    renderFavoritesList();
    showToast('已取消收藏', 'info');
    return true;
}

// 检查是否已收藏
function isFavorited(vodId, sourceCode) {
    const favorites = getFavorites();
    const key = `${sourceCode || ''}_${vodId}`;
    return favorites.some(f => {
        const fKey = `${f.source_code || ''}_${f.vod_id}`;
        return fKey === key;
    });
}

// 切换收藏状态
function toggleFavorite(item) {
    if (isFavorited(item.vod_id, item.source_code)) {
        removeFavorite(item.vod_id, item.source_code);
    } else {
        addFavorite(item);
    }
}

// 更新收藏徽章数量
function updateFavoriteBadge() {
    const badge = document.getElementById('favoriteCount');
    if (badge) {
        const count = getFavorites().length;
        badge.textContent = count;
        badge.style.display = count > 0 ? 'inline-block' : 'none';
    }
}

// 切换收藏面板
function toggleFavoritesPanel(e) {
    if (e) {
        e.preventDefault();
        e.stopPropagation();
    }

    const panel = document.getElementById('favoritesPanel');
    if (panel) {
        const isOpen = panel.classList.contains('show');
        if (isOpen) {
            panel.classList.remove('show');
        } else {
            panel.classList.add('show');
            renderFavoritesList();
            // 关闭设置面板和历史面板
            const settingsPanel = document.getElementById('settingsPanel');
            const historyPanel = document.getElementById('historyPanel');
            if (settingsPanel) settingsPanel.classList.remove('show');
            if (historyPanel) historyPanel.classList.remove('show');
        }
    }
}

// 渲染收藏列表
function renderFavoritesList() {
    const container = document.getElementById('favoritesList');
    if (!container) return;

    const favorites = getFavorites();

    if (favorites.length === 0) {
        container.innerHTML = '<div class="text-center text-gray-500 py-8">暂无收藏</div>';
        return;
    }

    container.innerHTML = favorites.reverse().map((item, index) => {
        const safeName = (item.vod_name || '')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
        const safeSource = (item.source_name || '未知来源')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
        const realIndex = favorites.length - 1 - index;

        return `
            <div class="favorite-item bg-[#191919] rounded-lg p-3 mb-3 hover:bg-[#222] transition-colors cursor-pointer relative group"
                 onclick="searchFavoriteItem('${safeName.replace(/'/g, "\\'")}')">
                <button onclick="event.stopPropagation(); removeFavorite('${item.vod_id}', '${item.source_code}');"
                        class="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-400 p-1 rounded-full hover:bg-gray-800 z-10"
                        title="取消收藏">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
                ${item.vod_pic ? `
                <div class="flex gap-3">
                    <div class="w-14 h-20 flex-shrink-0 rounded overflow-hidden bg-gray-800">
                        <img src="${item.vod_pic}" alt="${safeName}" 
                             class="w-full h-full object-cover" loading="lazy"
                             onerror="this.style.display='none'">
                    </div>
                    <div class="flex-1 min-w-0">
                ` : '<div class="flex-1 min-w-0">'}
                        <div class="text-sm font-medium text-white truncate">${safeName}</div>
                        <div class="flex flex-wrap items-center gap-1 mt-1">
                            ${item.vod_year ? `<span class="text-xs text-gray-400">${item.vod_year}</span>` : ''}
                            ${item.type_name ? `<span class="text-xs text-gray-500">${item.type_name}</span>` : ''}
                        </div>
                        <div class="text-xs text-gray-500 mt-1">${safeSource}</div>
                    </div>
                ${item.vod_pic ? '</div>' : ''}
            </div>
        `;
    }).join('');
}

// 从收藏项搜索
function searchFavoriteItem(title) {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.value = title;
        toggleFavoritesPanel();
        if (typeof search === 'function') {
            search();
        }
    }
}

// 清空所有收藏
function clearAllFavorites() {
    localStorage.removeItem(FAVORITES_KEY);
    updateFavoriteBadge();
    renderFavoritesList();
    showToast('已清空所有收藏', 'success');
}

// 导出函数到全局
window.addFavorite = addFavorite;
window.removeFavorite = removeFavorite;
window.isFavorited = isFavorited;
window.toggleFavorite = toggleFavorite;
window.getFavorites = getFavorites;
window.toggleFavoritesPanel = toggleFavoritesPanel;
window.renderFavoritesList = renderFavoritesList;
window.clearAllFavorites = clearAllFavorites;

// 页面初始化时更新收藏徽章
document.addEventListener('DOMContentLoaded', updateFavoriteBadge);