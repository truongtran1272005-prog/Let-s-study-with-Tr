let currentQuestions = [];
let currentIndex = 0;
let score = 0;
let userAnswers = []; // Lưu lại lịch sử trả lời của từng câu
let currentJsonFile = '';
let currentTitle = '';
let isRetryWrongMode = false; // Đánh dấu có đang ở chế độ làm lại câu sai hay không

// Chuyển đổi Dark / Light Mode
document.getElementById('theme-toggle').addEventListener('click', () => {
  document.body.classList.toggle('dark-mode');
});

// Tải câu hỏi từ JSON khi chọn Học phần
async function startQuiz(jsonFile, title) {
  try {
    currentJsonFile = jsonFile;
    currentTitle = title;

    const response = await fetch(`./${jsonFile}`);
    currentQuestions = await response.json();
    
    if (currentQuestions.length === 0) {
      alert("Học phần này chưa có câu hỏi!");
      return;
    }

    shuffleArray(currentQuestions);

    currentIndex = 0;
    score = 0;
    // Khởi tạo mảng lưu đáp án người dùng chọn
    userAnswers = new Array(currentQuestions.length).fill(null);

    document.getElementById('quiz-title').innerText = title;
    document.getElementById('home-view').classList.add('hidden');
    document.getElementById('result-view').classList.add('hidden');
    document.getElementById('quiz-view').classList.remove('hidden');
    
    showQuestion();
  } catch (error) {
    alert("Không thể tải dữ liệu câu hỏi. Hãy kiểm tra lại file JSON!");
  }
}

// Hiển thị câu hỏi
function showQuestion() {
  const q = currentQuestions[currentIndex];
  document.getElementById('quiz-progress').innerText = `Câu hỏi ${currentIndex + 1}/${currentQuestions.length} • Đúng: ${score} câu`;
  document.getElementById('question-text').innerText = q.question;

  // Cập nhật thanh tiến trình %
  const percent = ((currentIndex + 1) / currentQuestions.length) * 100;
  document.getElementById('progress-fill').style.width = `${percent}%`;

  // Vẽ Ma trận câu hỏi
  renderQuestionGrid();

  const container = document.getElementById('options-container');
  container.innerHTML = '';

  const previousAnswer = userAnswers[currentIndex];

  q.options.forEach((opt, index) => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.innerText = `${String.fromCharCode(65 + index)}. ${opt}`;

    // Nếu đã chọn câu này rồi thì hiển thị lại trạng thái cũ
    if (previousAnswer !== null) {
      btn.disabled = true;
      if (index === q.answer) btn.classList.add('correct');
      if (index === previousAnswer.selected && index !== q.answer) btn.classList.add('wrong');
    } else {
      btn.onclick = () => selectOption(btn, index, q.answer);
    }

    container.appendChild(btn);
  });
}

// Kiểm tra đáp án khi bấm chọn
function selectOption(btn, selectedIndex, correctIndex) {
  const buttons = document.querySelectorAll('.option-btn');
  buttons.forEach(b => b.disabled = true);

  const isCorrect = (selectedIndex === correctIndex);

  if (isCorrect) {
    btn.classList.add('correct');
    score++;
  } else {
    btn.classList.add('wrong');
    buttons[correctIndex].classList.add('correct');
  }

  // Lưu lịch sử làm bài của câu này
  userAnswers[currentIndex] = {
    selected: selectedIndex,
    isCorrect: isCorrect
  };

  renderQuestionGrid();
}

// Bảng Ma trận câu hỏi (1..N)
function renderQuestionGrid() {
  const grid = document.getElementById('question-grid');
  grid.innerHTML = '';

  currentQuestions.forEach((_, index) => {
    const item = document.createElement('div');
    item.className = 'grid-item';
    item.innerText = index + 1;

    if (index === currentIndex) item.classList.add('active');

    const ans = userAnswers[index];
    if (ans !== null) {
      if (ans.isCorrect) item.classList.add('correct');
      else item.classList.add('wrong');
    }

    // Bấm vào ô số để nhảy đến câu hỏi đó
    item.onclick = () => {
      currentIndex = index;
      showQuestion();
    };

    grid.appendChild(item);
  });
}

// Qua câu hỏi tiếp theo
function nextQuestion() {
  if (currentIndex < currentQuestions.length - 1) {
    currentIndex++;
    showQuestion();
  } else {
    showResult();
  }
}

// Hiển thị màn hình kết quả & Đánh giá xếp loại
function showResult() {
  document.getElementById('quiz-view').classList.add('hidden');
  document.getElementById('result-view').classList.remove('hidden');

  const total = currentQuestions.length;
  const percentage = Math.round((score / total) * 100);
  const mark10 = ((score / total) * 10).toFixed(1);

  document.getElementById('final-score').innerText = `${mark10} / 10 điểm`;
  document.getElementById('score-details').innerText = `Bạn trả lời đúng ${score}/${total} câu hỏi`;
  document.getElementById('score-percentage').innerText = `Tỷ lệ chính xác: ${percentage}%`;

  // Lọc ra danh sách các câu trả lời sai
  const wrongAnswersCount = userAnswers.filter(ans => ans !== null && !ans.isCorrect).length;
  const retryBtn = document.getElementById('retry-wrong-btn');

  if (wrongAnswersCount > 0) {
    retryBtn.classList.remove('hidden');
    document.getElementById('wrong-count').innerText = wrongAnswersCount;
  } else {
    retryBtn.classList.add('hidden'); // Nếu làm đúng hết 100% thì ẩn nút đi
  }
  // Xếp loại & Huy hiệu
  const badge = document.getElementById('rank-badge');
  if (mark10 >= 8.5) {
    badge.innerText = '🏆 Xuất sắc! Thần đồng Mác - Lênin';
  } else if (mark10 >= 7.0) {
    badge.innerText = '🥇 Giỏi! Kiến thức rất vững vàng';
  } else if (mark10 >= 5.0) {
    badge.innerText = '👍 Đạt! Cần ôn luyện thêm để điểm cao hơn';
  } else {
    badge.innerText = '📚 Chưa đạt! Bấm "Làm lại bài" để luyện tập thêm';
  }

  // Reset ô xem lại đáp án
  document.getElementById('review-container').classList.add('hidden');
  document.getElementById('review-container').innerHTML = '';
}

// Bật/Tắt chế độ xem lại đáp án
function toggleReviewMode() {
  const reviewContainer = document.getElementById('review-container');

  if (!reviewContainer.classList.contains('hidden')) {
    reviewContainer.classList.add('hidden');
    return;
  }

  reviewContainer.classList.remove('hidden');
  reviewContainer.innerHTML = '';

  currentQuestions.forEach((q, i) => {
    const userAns = userAnswers[i];
    const card = document.createElement('div');
    card.className = 'review-card';

    let html = `<h4>Câu ${i + 1}: ${q.question}</h4>`;
    q.options.forEach((opt, optIdx) => {
      let optClass = 'review-opt';
      if (optIdx === q.answer) optClass += ' is-correct';
      if (userAns && userAns.selected === optIdx && !userAns.isCorrect) optClass += ' user-wrong';

      html += `<div class="${optClass}">${String.fromCharCode(65 + optIdx)}. ${opt}</div>`;
    });

    card.innerHTML = html;
    reviewContainer.appendChild(card);
  });
}

function restartQuiz() {
  startQuiz(currentJsonFile, currentTitle);
}

function goHome() {
    document.getElementById('home-view').classList.remove('hidden');
  document.getElementById('quiz-view').classList.add('hidden');
  document.getElementById('result-view').classList.add('hidden');
  document.title = "Let's study with Tr";
  isRetryWrongMode = false;
}
  document.getElementById('home-view').classList.remove('hidden');
  document.getElementById('quiz-view').classList.add('hidden');
  document.getElementById('result-view').classList.add('hidden');
  isRetryWrongMode = false; // Reset lại trạng thái ôn câu sai khi về trang chủ


function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
// Chức năng lọc và bắt đầu làm lại các câu trả lời sai
function retryWrongQuestions() {
  // Lọc ra các câu mà userAnswers có isCorrect === false
  const wrongQuestions = [];
  userAnswers.forEach((ans, index) => {
    if (ans !== null && !ans.isCorrect) {
      wrongQuestions.push(currentQuestions[index]);
    }
  });

  if (wrongQuestions.length === 0) {
    alert("Không có câu nào sai để làm lại!");
    return;
  }

  // Gán danh sách câu hỏi hiện tại thành danh sách các câu sai
  currentQuestions = wrongQuestions;
  currentIndex = 0;
  score = 0;
  userAnswers = new Array(currentQuestions.length).fill(null);
  isRetryWrongMode = true;

  document.getElementById('quiz-title',).innerText = `${currentTitle} (Ôn lại câu sai)`;
  document.getElementById('result-view').classList.add('hidden');
  document.getElementById('quiz-view').classList.remove('hidden');

  showQuestion();
}
// Danh sách câu thành ngữ & câu nói truyền động lực
const quotes = [
  "Trời có bốn mùa Xuân, Hạ, Thu, Đông, nhưng học tập thì chỉ có một mùa: mùa học.",
  "Học, học nữa, học mãi. — V.I. Lenin",
  "Kỷ luật là cầu nối giữa mục tiêu và thành công.",
  "Hành trình vạn dặm bắt đầu từ một bước chân.",
  "Hãy học theo cách của bạn.",
  "Keep going, keep growing.",
  "Tri thức là sức mạnh.",
  "Làm việc chăm chỉ không bằng cách làm việc thông minh.",
  "Practice makes perfect — Luyện tập tạo nên sự hoàn hảo."
];

// Hàm thay đổi câu thành ngữ ngẫu nhiên
function changeQuote() {
  const quoteElem = document.getElementById('quote-text');
  if (quoteElem) {
    const randomIndex = Math.floor(Math.random() * quotes.length);
    quoteElem.innerText = quotes[randomIndex];
  }
}

// Tự động chọn 1 câu ngẫu nhiên khi tải trang và đổi câu mới mỗi 30 giây
changeQuote();
setInterval(changeQuote, 15000);
