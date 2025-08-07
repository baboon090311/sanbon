
document.addEventListener('DOMContentLoaded', function() {
    const dateInput = document.getElementById('mealDate');
    const searchBtn = document.getElementById('searchBtn');
    const loading = document.getElementById('loading');
    const mealContent = document.getElementById('mealContent');
    const selectedDateDisplay = document.getElementById('selectedDate');
    
    // 오늘 날짜를 기본값으로 설정
    const today = new Date();
    const formattedToday = today.toISOString().split('T')[0];
    dateInput.value = formattedToday;
    
    // 검색 버튼 클릭 이벤트
    searchBtn.addEventListener('click', function() {
        const selectedDate = dateInput.value;
        if (selectedDate) {
            searchMealInfo(selectedDate);
        } else {
            alert('날짜를 선택해주세요.');
        }
    });
    
    // Enter 키로도 검색 가능
    dateInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchBtn.click();
        }
    });
    
    // 급식정보 검색 함수
    async function searchMealInfo(date) {
        // 로딩 표시
        loading.classList.remove('hidden');
        mealContent.innerHTML = '<p class="no-data">급식정보를 불러오는 중...</p>';
        
        try {
            // 날짜 포맷 변경 (YYYY-MM-DD -> YYYYMMDD)
            const formattedDate = date.replace(/-/g, '');
            
            // API URL 구성
            const apiUrl = `https://open.neis.go.kr/hub/mealServiceDietInfo?ATPT_OFCDC_SC_CODE=J10&SD_SCHUL_CODE=7530079&MLSV_YMD=${formattedDate}`;
            
            // CORS 프록시를 사용하여 API 호출
            const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(apiUrl)}`;
            
            const response = await fetch(proxyUrl);
            
            if (!response.ok) {
                throw new Error('네트워크 오류가 발생했습니다.');
            }
            
            const xmlText = await response.text();
            
            // XML 파싱
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
            
            // 급식 정보 추출
            const mealItems = xmlDoc.getElementsByTagName('DDISH_NM');
            
            // 날짜 표시 업데이트
            const dateObj = new Date(date);
            const options = { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                weekday: 'long'
            };
            selectedDateDisplay.textContent = dateObj.toLocaleDateString('ko-KR', options);
            
            if (mealItems.length > 0) {
                // 급식 메뉴가 있는 경우
                const mealMenu = mealItems[0].textContent;
                displayMealInfo(mealMenu);
            } else {
                // 급식 정보가 없는 경우
                mealContent.innerHTML = '<p class="no-data">해당 날짜에 급식정보가 없습니다.</p>';
            }
            
        } catch (error) {
            console.error('Error fetching meal info:', error);
            mealContent.innerHTML = `
                <div class="error-message">
                    <strong>오류가 발생했습니다:</strong><br>
                    급식정보를 불러올 수 없습니다. 인터넷 연결을 확인하거나 잠시 후 다시 시도해주세요.
                </div>
            `;
        } finally {
            // 로딩 숨기기
            loading.classList.add('hidden');
        }
    }
    
    // 급식정보 표시 함수
    function displayMealInfo(mealMenu) {
        // 메뉴 정리 (HTML 태그 제거 및 개행 처리)
        let cleanMenu = mealMenu
            .replace(/<br\s*\/?>/gi, '\n')  // <br> 태그를 개행으로 변경
            .replace(/<[^>]*>/g, '')        // 모든 HTML 태그 제거
            .replace(/&nbsp;/g, ' ')        // &nbsp; 제거
            .trim();
        
        // 메뉴 항목들을 배열로 분리
        const menuItems = cleanMenu
            .split('\n')
            .filter(item => item.trim() !== '')
            .map(item => item.trim());
        
        if (menuItems.length > 0) {
            const menuHtml = menuItems
                .map(item => `<span class="menu-item">${item}</span>`)
                .join('');
            
            mealContent.innerHTML = `<div class="meal-menu">${menuHtml}</div>`;
        } else {
            mealContent.innerHTML = '<p class="no-data">급식 메뉴 정보가 없습니다.</p>';
        }
    }
    
    // 페이지 로드 시 오늘 급식정보 자동 조회
    searchMealInfo(formattedToday);
});
