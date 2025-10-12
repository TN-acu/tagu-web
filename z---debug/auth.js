(function() {
    // モバイル端末かどうかを判定
    if (/Android|webOS|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        // モバイル端末の場合、カウントダウン処理を開始
        document.addEventListener('DOMContentLoaded', function() {
            let count = 10;
            const countdownElement = document.getElementById('countdown');

            if (countdownElement) {
                countdownElement.textContent = count; // 初期値を表示
                const timer = setInterval(function() {
                    count--;
                    countdownElement.textContent = count;
                    if (count <= 0) {
                        clearInterval(timer); // カウントダウンを停止
                        window.location.href = 'https://tagu-web.main.jp/digiapp/convenient-parking'; // 指定URLへ遷移
                    }
                }, 1000);
            }
        });
    } else {
        // PC（モバイル端末以外）の場合、404ページへリダイレクト
        window.location.href = '../404.html';
        throw new Error('Unauthorized PC access.'); // 念のためスクリプトの実行を停止
    }
})();