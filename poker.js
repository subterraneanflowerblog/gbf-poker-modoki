const Suit = {
  SPADE: '♠️',
  CLUB: '♣️',
  DIAMOND: '♦️',
  HEART: '♥️'
};

const suitList = [
  Suit.SPADE,
  Suit.CLUB,
  Suit.DIAMOND,
  Suit.HEART
];

const cardList = [
  {rank: 2, label: '2' },
  {rank: 3, label: '3' },
  {rank: 4, label: '4' },
  {rank: 5, label: '5' },
  {rank: 6, label: '6' },
  {rank: 7, label: '7' },
  {rank: 8, label: '8' },
  {rank: 9, label: '9' },
  {rank: 10, label: '10' },
  {rank: 11, label: 'J' },
  {rank: 12, label: 'Q' },
  {rank: 13, label: 'K' },
  {rank: 14, label: 'A' }
];

// 各スートごとに2からAまで作成する
const deckBase = 
    suitList
        .map((suit) => cardList.map((card) => ({suit, ...card})))
        .flat()
        .map(Object.freeze);

// ジョーカー
const joker = Object.freeze({ isWildcard: true, label: 'Joker' });

// 山札クラス
class Deck {
  constructor(options = {}) {
    this._deck = [...deckBase]; // deckBaseをコピー
    if(options.includesJoker) { this._deck.push(joker); }

    // シャッフル
    this._deck.sort((a, b) => Math.random() - 0.5);
  }

  // 山札からカードを取り出すメソッド
  deal(num) {
    return this._deck.splice(0, num);
  }
}

// スートごとの枚数をカウントする関数
const countSuit = (cardList) => {
  let wildcard = 0;
  const count = {
    [Suit.SPADE]: 0,
    [Suit.CLUB]: 0,
    [Suit.DIAMOND]: 0,
    [Suit.HEART] : 0
  };

  for(const card of cardList) {
    if(card.isWildcard) { wildcard++; }
    else { count[card.suit]++; }
  }

  return {
    wildcard,
    ...count
  }
};

// ランクごとの枚数をカウントする関数
const countRank = (cardList) => {
  // インデックスが0から14までの15要素の配列
  // 0,1は未使用で2から14はそれぞれのカード
  // 全て0で初期化しておく
  let wildcardCount = 0;
  const rankCount = new Array(15).fill(0);

  // カウントする
  for(const card of cardList) {
    if(card.isWildcard) {
      wildcardCount++;
    } else {
      rankCount[card.rank]++;
    }
  }

  return {
    wildcard: wildcardCount,
    rank: rankCount
  };
};

// ジョーカーを取り除く関数
const removeJoker = (cardList) => {
  return cardList.filter((c) => !c.isWildcard);
};

// カードのランクでソートする関数
const sortByRank = (cardList) => {
  return [...cardList].sort((a, b) => a.rank - b.rank);
};

// フラッシュ（5枚全てが同じスート）
// ジョーカーも考慮する
const isFlush = (cardList) => {
  const count = countSuit(cardList);
  return suitList.some(
    (s) => count[s] + count.wildcard === 5
  );
};

// ストレート（5枚のランクが連続している）
// ジョーカーも考慮する
const isStraight = (cardList) => {
  const count = countSuit(cardList);

  // ランクでソートしておく
  const canonical = sortByRank(removeJoker(cardList));

  let straight = true;
  let remainWildcard = count.wildcard;
  for(let index = 0; index < canonical.length - 1; index++) {
    const current = canonical[index];
    const next = canonical[index+1];

    // 隣り合うカード間のランク差
    // ランクでソート済みなので、差を調べるだけでわかる
    // 隣同士の差が1ならストレート
    let gap = next.rank - current.rank;

    // A(14), 2, 3, 4, 5はストレート
    // （余談）K, A, 2, 3, 4などAを挟むのはストレートではないらしい
    const aceStart = index === 0 && current.label == 'A' && next.label === '2';
    if(aceStart) { gap = 1; }

    // gapが2でジョーカーが残っていれば埋める
    // 5, Joker, 7, 8, 9、みたいなやつ
    const useJoker = gap == 2 && remainWildcard > 0;
    if(useJoker) {
      gap = 1;
      remainWildcard--;
    }

    // 差が1でなければストレートではない
    if(gap !== 1) {
      straight = false;
      break;
    }
  }

  return straight;
};

// ストレートフラッシュ
const isStraightFlush = (cardList) => {
  return isStraight(cardList) && isFlush(cardList);
};

// ロイヤルストレートフラッシュ
const isRoyalStraightFlush = (cardList) => {
  // ストレートフラッシュでないならfalse
  if(!isStraightFlush(cardList)) { return false; }

  // 10〜Aが全てあるかチェック
  // ストレートフラッシュは満たしているので、
  // 重複チェックは不要
  const royalCards = ['10', 'J', 'Q', 'K', 'A'];
  let score = 0;
  for(const card of cardList) {
    if(card.isWildcard || royalCards.includes(card.label)) {
      score++;
    }
  }

  return score === 5;
};

// ファイブカード
const isFiveOfAKind = (cardList) => {
  const count = countRank(cardList);
  return count.rank.some((c) => c + count.wildcard === 5);
};

// フォーカード
const isFourOfAKind = (cardList) => {
  const count = countRank(cardList);
  return count.rank.some((c) => c + count.wildcard === 4);
}

// スリーカード
const isThreeOfAKind = (cardList) => {
  const count = countRank(cardList);
  return count.rank.some((c) => c + count.wildcard === 3);
};

// ツーペア
const isTwoPair = (cardList) => {
  const count = countRank(cardList);

  // ジョーカーがあるとツーペアになりえない
  if(count.wildcard) { return false; }

  // 2枚が2つあればツーペア
  return count.rank.filter((c) => c === 2).length === 2;
};

// ワンペア
const isOnePair = (cardList) => {
  const count = countRank(cardList);
  return count.rank.some((c) => c + count.wildcard === 2);
};

// フルハウス
const isFullHouse = (cardList) => {
  const count = countRank(cardList);

  // ジョーカーがあれば、
  // ジョーカーを除いてツーペアを調べる
  if(count.wildcard) {
    return isTwoPair(removeJoker(cardList));
  }

  // ジョーカーがなければ、
  // 2枚と3枚のランクを探す
  const two = count.rank.find((c) => c === 2);
  const three = count.rank.find((c) => c === 3);

  return !!(two && three);
};

// 役名を取得する関数
const getHandName = (cardList) => {
  if(isRoyalStraightFlush(cardList)) {
    return 'ロイヤルストレートフラッシュ';
  } else if(isFiveOfAKind(cardList)) {
    return 'ファイブカード';
  } else if(isStraightFlush(cardList)) {
    return 'ストレートフラッシュ';
  } else if(isFourOfAKind(cardList)) {
    return 'フォーカード';
  } else if(isFullHouse(cardList)) {
    return 'フルハウス';
  } else if(isFlush(cardList)) {
    return 'フラッシュ';
  } else if(isStraight(cardList)) {
    return 'ストレート';
  } else if(isThreeOfAKind(cardList)){
    return 'スリーカード';
  } else if(isTwoPair(cardList)) {
    return 'ツーペア';
  } else if(isOnePair(cardList)) {
    return 'ワンペア';
  } else {
    return 'ノーペア';
  }
};