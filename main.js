// カードを表す要素を作成する関数
const createCardElement = (card) => {
  const elem = document.createElement('div');
  elem.classList.add('card');

  // 「♣️K」のような表示を作る
  const cardLabel = document.createElement('div');
  cardLabel.innerText = `${card.suit || ''}${card.label}`;
  elem.appendChild(cardLabel);

  // isHoldフラグがあれば、「HOLD」表示を追加し、
  // 要素にholdクラスを追加する
  if(card.isHold) {
    const holdIndicator = document.createElement('div');
    holdIndicator.innerText = 'HOLD';
    elem.appendChild(holdIndicator);
    elem.classList.add('hold');
  }

  return elem;
};

//
// メイン処理
//

(function startGame() {
  // カード情報作成
  const deck = new Deck({includesJoker: true});
  const cards = deck.deal(5).map((c) => ({isHold: false, ...c}));

  // カードを描画する
  // renderTargetは描画対象（ここではdocument.bodyにしておきます）
  // stateは現在の状態（手札のリストとゲームフェーズ）です
  (function render(renderTarget, state) {
    renderTarget.innerText = ''; // 描画内容をクリア

    // カードの組を表示するコンテナを作成
    const container = document.createElement('div');
    container.classList.add('card-group');
    renderTarget.appendChild(container);

    // 各カードの内容をコンテナに詰め込む
    for(const card of state.cardList) {
      const cardElem = createCardElement(card);

      // カードをクリックすると保持状態を切り替え
      // 全体を再描画する
      // ゲームフェーズがdoneのときは押せない
      if(state.phase !== 'done') {
        cardElem.addEventListener('click', () => {
          card.isHold = !card.isHold;
          render(renderTarget, state);
        });
      }

      container.appendChild(cardElem);
    }

    // 現在のゲームフェーズを見て処理を変える
    if(state.phase === 'done') {
      // 役の表示
      const hand = getHandName(state.cardList);
      const handLabel = document.createElement('div');
      handLabel.innerText = hand;
      renderTarget.appendChild(handLabel);

      // 次のゲームを開始するボタン
      const nextGameButton = document.createElement('button');
      nextGameButton.innerText = '次のゲームへ';
      nextGameButton.addEventListener('click', () => {
        startGame();
      });
      renderTarget.appendChild(nextGameButton);
    } else {
      // カード交換ボタン
      // クリックすると保持フラグのついていないカードを交換し
      // 再描画する
      const changeButton = document.createElement('button');
      changeButton.innerText = '交換する';
      changeButton.addEventListener('click', () => {
        const newCardList = state.cardList
            .map((c) => c.isHold ? c : deck.deal(1)[0]);
        
        render(renderTarget, {
          cardList: newCardList,
          phase: 'done'
        });
      });
      renderTarget.appendChild(changeButton);
    }
  })(document.body, {cardList: cards});
})();