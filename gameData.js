/* =================================================================
   1. 基本データの設計図（クラス）
================================================================= */

/**
 * ドライバーさんの情報をぜんぶ入れるための設計図です！
 * （既存の20人も、浪人リストの40人も、これを使います）
 */
class Driver {
    /**
     * @param {string} id - 固有のID（呼び出す時用）
     * @param {string} name - ドライバー名
     * @param {string} nationality - 国籍
     * @param {number} qs - 予選での速さ
     * @param {number} rs - 決勝での速さ
     * @param {number} reliability - 信頼性（ドライビングエラー）
     * @param {number} stability - 安定感
     * @param {number} salary - 年俸（万ドル）
     * @param {number} contractYears - （既存選手用）残り契約年数
     * @param {string} specialAbilityCode - 特殊能力のコード
     * 'DEV_UP': 開発ボーナス
     * 'GROW_A': アロンソ型成長
     * 'GROW_B': ライコネン/バトン型成長
     * 'GROW_C': ハイドフェルド型成長
     * 'GROW_D': マッサ型成長
     * 'GROW_E': ブルーニ型成長
     * 'GROW_F': ロッテラー/トレルイエ型成長
     * 'RACE_BONUS_JP': 日本GPボーナス（佐藤琢磨選手）
     * 'NONE': なし
     */
    constructor(id, name, nationality, qs, rs, reliability, stability, salary, contractYears, specialAbilityCode) {
        this.id = id;
        this.name = name;
        this.nationality = nationality;
        this.qs = qs;
        this.rs = rs;
        this.reliability = reliability;
        this.stability = stability;
        this.salary = salary;
        this.contractYears = contractYears;
        this.specialAbilityCode = specialAbilityCode;
        this.points = 0;
        this.team = null;
        // ★NEW!★ フィニッシュ順位の回数を記録する配列を追加！
        // finishes[1] = 1位の回数, finishes[2] = 2位の回数 ... finishes[8] = 8位の回数
        this.finishes = [0, 0, 0, 0, 0, 0, 0, 0, 0]; // 0番目は使わない
    }
}

/**
 * マシン（シャシー）の情報を入れる設計図です！
 */
class Machine {
    /**
     * @param {string} name - マシン名（例: "フェラーリ" や "プロストAP04"）
     * @param {number} straight - ストレートスピード
     * @param {number} cornering - コーナリングスピード
     * @param {number} reliability - 信頼性（メカニカル）
     * @param {number} stability - 安定感
     * @param {string} tyre - タイヤメーカー ("Bridgestone" または "Michelin")
     */
    constructor(name, straight, cornering, reliability, stability, tyre) {
        this.name = name;
        this.straight = straight;
        this.cornering = cornering;
        this.reliability = reliability;
        this.stability = stability;
        this.tyre = tyre; // 既存チームは固定、プレイヤーは選択
    }
}

/**
 * エンジンの情報を入れる設計図です！
 */
class Engine {
    /**
     * @param {string} id - 固有ID
     * @param {string} name - エンジン名
     * @param {number} straightBonus - ストレートへのボーナス
     * @param {number} corneringBonus - コーナリングへのボーナス
     * @param {number} reliabilityBonus - 信頼性へのボーナス
     * @param {number} price - 価格（万ドル）
     * @param {number} availabilityYear - 利用可能になる年（例: 1年目なら 1）
     * @param {object} restriction - 割引の「縛り」ルール
     * { drivers: ["ドライバーID", ...], discountPrice: 割引後の価格 }
     * { nationality: "国籍", discountPrice: 割引後の価格 }
     */
    constructor(id, name, straightBonus, corneringBonus, reliabilityBonus, price, availabilityYear, restriction = null) {
        this.id = id;
        this.name = name;
        this.straightBonus = straightBonus;
        this.corneringBonus = corneringBonus;
        this.reliabilityBonus = reliabilityBonus;
        this.price = price;
        this.availabilityYear = availabilityYear;
        this.restriction = restriction;
    }
}

/**
 * レースカレンダー（コース特性）の設計図です！
 */
class RaceTrack {
    /**
     * @param {number} round - 第n戦
     * @param {string} name - GP名 (例: "オーストラリアGP")
     * @param {string} type - コース特性 ("Normal", "Straight", "Cornering")
     */
    constructor(round, name, type) {
        this.round = round;
        this.name = name;
        this.type = type;
    }
}

/* =================================================================
   2. プレイヤーチームの「今」の状態を入れる設計図
================================================================= */

/**
 * プレイヤー（ベンジーさん！）のチーム情報をぜんぶ管理する設計図です！
 * これがゲームの「セーブデータ」の中心になります！
 */
class PlayerTeam {
    constructor() {
        this.teamName = "フェニックス・グランプリ"; // ★チーム名を追加しました！
        this.money = 5000; // 初期資金 5000万ドル
        this.year = 1; // 参戦1年目
        this.developmentTurnsLeft = 20; // 開幕前の開発ターン
        
        // ★★★ 5年間通算成績用の箱 (ここが大事です！) ★★★
        this.careerWins = 0; 
        this.careerConstructorTitles = 0;
        this.careerDriverTitles = 0; 
        this.totalCareerPoints = 0; 
        this.annualResults = []; // ★この行が、このまま入ってますか？
        this.purchasedItemIds = [];
        // ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
        
        // 選択していくもの
        this.tyre = null; // "Bridgestone" か "Michelin"
        this.chassis = null; // Machineオブジェクトが入ります
        this.engine = null; // Engineオブジェクトが入ります
        this.driver1 = null; // Driverオブジェクトが入ります
        this.driver2 = null; // Driverオブジェクトが入ります
        
        // マシンの「現在」のスペック
        // (シャシー + エンジンボーナス + 開発 で変動していく)
        this.currentSpec = {
            straight: 0,
            cornering: 0,
            reliability: 0,
            stability: 0 // 安定感はシャシー初期値のまま
        };
        
        // スポンサー契約金（シーズンごとにリセット）
        this.sponsorMoney = 0;
    }

    /**
     * チーム立ち上げ時に、シャシーやエンジンを選んだら
     * この関数を呼んで、スペックを「合体」させます！
     * (★安定感の計算を修正)
     */
    calculateInitialSpec() {
        if (!this.chassis || !this.engine) {
            console.error("まだシャシーかエンジンが選ばれていません！");
            return;
        }

        // ★数値保証を追加
        const chassisStraight = Number(this.chassis.straight) || 0;
        const chassisCornering = Number(this.chassis.cornering) || 0;
        const chassisReliability = Number(this.chassis.reliability) || 0;
        const chassisStability = Number(this.chassis.stability) || 0; // ★ベース安定感

        const engineStraightBonus = (this.engine && typeof this.engine.straightBonus === 'number') ? this.engine.straightBonus : 0;
        const engineCorneringBonus = (this.engine && typeof this.engine.corneringBonus === 'number') ? this.engine.corneringBonus : 0;
        const engineReliabilityBonus = (this.engine && typeof this.engine.reliabilityBonus === 'number') ? this.engine.reliabilityBonus : 0;

        this.currentSpec.straight = chassisStraight + engineStraightBonus;
        this.currentSpec.cornering = chassisCornering + engineCorneringBonus;
        this.currentSpec.reliability = chassisReliability + engineReliabilityBonus;
        // ★安定感はベースシャシーの値をそのまま使う！ (エンジンボーナスは無い)
        this.currentSpec.stability = chassisStability;

        console.log("初期スペックが計算されました！", this.currentSpec);
    }

    // ... ここに「開発」の関数とか「お金を使う」関数を
    //     これからいっぱい追加していくことになります！ ...
}


/* =================================================================
   3. ゲームの基本データ（ここからがデータ本体です！）
================================================================= */

// ----------------------------------------------------------------
// 3-1. 既存10チームのマシンデータ
// (messages[11].chunks[0] と messages[13].chunks[0]のタイヤ情報)
// ----------------------------------------------------------------
const EXISTING_MACHINES = {
    "ferrari": new Machine("フェラーリ", 95, 95, 90, 80, "Bridgestone"),
    "williams": new Machine("ウィリアムズ", 99, 91, 85, 80, "Michelin"),
    "mclaren": new Machine("マクラーレン", 93, 95, 92, 85, "Michelin"),
    "renault": new Machine("ルノー", 88, 96, 75, 88, "Michelin"),
    "sauber": new Machine("ザウバー", 88, 82, 75, 78, "Bridgestone"),
    "jordan": new Machine("ジョーダン", 83, 80, 70, 75, "Bridgestone"),
    "jaguar": new Machine("ジャガー", 86, 83, 72, 72, "Michelin"),
    "bar": new Machine("B.A.R", 93, 85, 75, 75, "Bridgestone"),
    "minardi": new Machine("ミナルディ", 81, 78, 80, 80, "Bridgestone"),
    "toyota": new Machine("トヨタ", 85, 80, 82, 78, "Bridgestone")
};

// ----------------------------------------------------------------
// 3-2. 既存20人のドライバーデータ
// (★ユーザーリクエストにより、フルネーム表記に修正)
// ----------------------------------------------------------------
const EXISTING_DRIVERS = [
    // フェラーリ
    new Driver("m_schumacher", "ミハエル・シューマッハー", "ドイツ", 95, 98, 92, 95, 3000, 4, "DEV_UP"),
    new Driver("barrichello", "ルーベンス・バリチェロ", "ブラジル", 94, 93, 91, 93, 1000, 3, "DEV_UP"),
    // ウィリアムズ
    new Driver("montoya", "ファン・パブロ・モントーヤ", "コロンビア", 95, 95, 88, 85, 1200, 2, "NONE"),
    new Driver("r_schumacher", "ラルフ・シューマッハー", "ドイツ", 91, 91, 85, 78, 700, 2, "NONE"),
    // マクラーレン
    new Driver("coulthard", "デイヴィッド・クルサード", "イギリス", 82, 88, 90, 77, 600, 2, "DEV_UP"),
    new Driver("raikkonen", "キミ・ライコネン", "フィンランド", 90, 97, 82, 89, 1400, 4, "GROW_B"),
    // ルノー
    new Driver("trulli", "ヤルノ・トゥルーリ", "イタリア", 99, 90, 87, 84, 500, 2, "NONE"),
    new Driver("alonso", "フェルナンド・アロンソ", "スペイン", 88, 95, 82, 80, 1000, 3, "GROW_A"),
    // ザウバー
    new Driver("heidfeld", "ニック・ハイドフェルド", "ドイツ", 87, 86, 82, 93, 250, 1, "GROW_C"),
    new Driver("frentzen", "ハインツ＝ハラルド・フレンツェン", "ドイツ", 86, 87, 87, 90, 260, 1, "NONE"),
    // ジョーダン
    new Driver("fisichella", "ジャンカルロ・フィジケラ", "イタリア", 88, 92, 85, 90, 400, 1, "NONE"),
    new Driver("firman", "ラルフ・ファーマン", "アメリカ", 84, 86, 80, 83, 100, 1, "NONE"),
    // ジャガー
    new Driver("webber", "マーク・ウェバー", "オーストラリア", 97, 89, 80, 80, 400, 2, "NONE"),
    new Driver("pizzonia", "アントニオ・ピッツォニア", "ブラジル", 82, 82, 75, 80, 60, 1, "NONE"),
    // B.A.R
    new Driver("villeneuve", "ジャック・ヴィルヌーヴ", "カナダ", 83, 85, 81, 78, 700, 1, "NONE"),
    new Driver("button", "ジェンソン・バトン", "イギリス", 88, 90, 83, 94, 250, 5, "GROW_B"),
    // ミナルディ
    new Driver("verstappen", "ヨス・フェルスタッペン", "オランダ", 86, 89, 80, 90, 150, 1, "DEV_UP"),
    new Driver("wilson", "ジャスティン・ウィルソン", "イギリス", 82, 80, 80, 78, 50, 1, "NONE"),
    // トヨタ
    new Driver("panis", "オリビエ・パニス", "フランス", 85, 88, 82, 93, 450, 2, "DEV_UP"),
    new Driver("damatta", "クリスティアーノ・ダ・マッタ", "ブラジル", 92, 86, 80, 80, 250, 2, "NONE")
];

// ----------------------------------------------------------------
// 3-3. プレイヤーが選べる初期シャシー (3択)
// (messages[15].chunks[0])
// ----------------------------------------------------------------
const PLAYER_CHASSIS_OPTIONS = {
    "prost": new Machine("プロストAP04 (ストレート重視)", 70, 60, 60, 60, null),
    "arrows": new Machine("アロウズA23 (コーナリング重視)", 60, 70, 60, 60, null),
    "honda": new Machine("ホンダRA099 (信頼性重視)", 55, 55, 90, 60, null)
};

// (gameData.js の中の ENGINE_OPTIONS をこれに入れ替えてください)

// ----------------------------------------------------------------
// 3-4. プレイヤーが契約できるエンジン
// (★ユーザー修正により、割引ルールと紹介文を変更！)
// ----------------------------------------------------------------
const ENGINE_OPTIONS = [
    // 1年目から
    new Engine("cosworth", "コスワース", -2, 0, 0, 300, 1),
    new Engine("asiatech", "アジアテック", -4, -2, 1, 0, 1),
    new Engine("ferrari", "フェラーリ", 8, 0, 5, 3000, 1, 
        { 
            drivers: ["massa", "badoer"], 
            discountPrice: 2500,
            discountText: "※ドライバーにフェリペ・マッサ、ルカ・バドエルのいずれかを起用すると2500万ドル"
        }
    ),
    new Engine("honda", "ホンダ", 7, 0, -3, 1500, 1,
        { 
            drivers: ["sato", "fukuda", "kaneishi"], 
            discountPrice: 750,
            discountText: "※ドライバーに佐藤琢磨、福田良、金石年弘のいずれかを起用すると750万ドル"
        }
    ),
    // 2年目から
    new Engine("toyota", "トヨタ", 3, 0, 3, 1200, 2,
        { 
            drivers: ["takagi", "briscoe", "zonta"], 
            discountPrice: 600,
            discountText: "※ドライバーに高木虎之介、ライアン・ブリスコー、リカルド・ゾンタのいずれかを起用すると600万ドル"
        }
    ),
    new Engine("bmw", "BMW", 10, -1, 0, 2500, 2,
        { 
            nationality: "ドイツ", 
            discountPrice: 2000,
            discountText: "※ドイツ国籍のドライバーを起用すると2000万ドル"
        }
    ),
    new Engine("renault", "ルノー", 1, 8, -5, 2000, 2),
    new Engine("mercedes", "メルセデス", 7, 3, -8, 2000, 2)
];

// ----------------------------------------------------------------
// 3-5. 獲得可能ドライバーリスト（1年目に契約可能）
// ----------------------------------------------------------------

const AVAILABLE_DRIVERS = [
    new Driver("badoer", "ルカ・バドエル", "イタリア", 76, 78, 83, 90, 150, 1, "DEV_UP"),
    new Driver("massa", "フェリペ・マッサ", "ブラジル", 83, 85, 70, 73, 150, 1, "NONE"),
    new Driver("gene", "マルク・ジェネ", "スペイン", 83, 83, 82, 80, 180, 1, "DEV_UP"),
    new Driver("wurz", "アレクサンダー・ヴルツ", "オーストリア", 82, 86, 84, 78, 200, 1, "DEV_UP"),
    new Driver("delarosa", "ペドロ・デ・ラ・ロサ", "スペイン", 81, 85, 80, 75, 180, 1, "NONE"),
    new Driver("mcnish", "アラン・マクニッシュ", "イギリス", 80, 83, 82, 90, 160, 1, "DEV_UP"),
    new Driver("montagny", "フランク・モンタニー", "フランス", 79, 79, 79, 79, 120, 1, "NONE"),
    new Driver("jani", "ニール・ジャニ", "スイス", 79, 78, 74, 74, 50, 1, "NONE"),
    new Driver("baumgartner", "ゾルト・バウムガルトナー", "ハンガリー", 80, 82, 80, 85, 80, 1, "NONE"),
    new Driver("davidson", "アンソニー・デイヴィッドソン", "イギリス", 83, 86, 80, 90, 200, 1, "DEV_UP"),
    new Driver("bruni", "ジャンマリア・ブルーニ", "イタリア", 84, 83, 79, 82, 150, 1, "NONE"),
    new Driver("zlobin", "セルゲイ・ズロビン", "ロシア", 60, 60, 60, 75, -300, 1, "NONE"),
    new Driver("sato", "佐藤琢磨", "日本", 92, 90, 75, 70, 400, 1, "RACE_BONUS_JP"),
    new Driver("motoyama", "本山哲", "日本", 85, 85, 85, 85, 200, 1, "NONE"),
    new Driver("wakisaka", "脇阪寿一", "日本", 82, 84, 82, 83, 150, 1, "NONE"),
    new Driver("mitsusada", "光貞秀俊", "日本", 82, 83, 88, 81, 150, 1, "NONE"),
    new Driver("krumm", "ミハエル・クルム", "ドイツ", 82, 82, 80, 80, 120, 1, "NONE"),
    new Driver("hakkinen", "ミカ・ハッキネン", "フィンランド", 99, 95, 85, 93, 3000, 1, "NONE"),
    new Driver("fittipaldi", "クリスチャン・フィッティパルディ", "ブラジル", 86, 87, 85, 90, 400, 1, "NONE"),
    new Driver("bernoldi", "エンリケ・ベルノルディ", "スペイン", 82, 82, 80, 83, 130, 1, "NONE"),
    new Driver("irvine", "エディ・アーバイン", "イギリス", 82, 90, 88, 82, 600, 1, "NONE"),
    new Driver("salo", "ミカ・サロ", "フィンランド", 85, 88, 88, 83, 350, 1, "DEV_UP"),
    new Driver("yoong", "アレックス・ユーン", "マレーシア", 72, 75, 70, 78, -300, 1, "NONE"),
    new Driver("tracy", "ポール・トレーシー", "カナダ", 88, 92, 92, 93, 1200, 1, "NONE"),
    new Driver("franchitti", "ダリオ・フランキッティ", "イギリス", 83, 85, 83, 88, 250, 1, "NONE"),
    new Driver("dixon", "スコット・ディクソン", "ニュージーランド", 86, 87, 83, 89, 500, 1, "NONE"),
    new Driver("junqueira", "ブルーノ・ジュンケイラ", "ブラジル", 83, 83, 85, 93, 300, 1, "NONE"),
    new Driver("kanaan", "トニー・カナーン", "ブラジル", 87, 89, 85, 83, 500, 1, "NONE"),
    new Driver("nakano", "中野信治", "日本", 84, 86, 92, 92, 350, 1, "DEV_UP"),
    new Driver("andretti", "マイケル・アンドレッティ", "アメリカ", 84, 85, 50, 75, 800, 1, "NONE"),
    new Driver("lotterer", "アンドレ・ロッテラー", "ドイツ", 82, 82, 78, 83, 200, 1, "NONE"),
    new Driver("monteiro", "ティアゴ・モンテイロ", "ポルトガル", 80, 81, 98, 90, 150, 1, "NONE"),
    new Driver("bourdais", "セバスチャン・ボーデ", "フランス", 81, 83, 81, 75, 250, 1, "NONE"),
    new Driver("friesacher", "パトリック・フリーザッハー", "オーストリア", 80, 79, 80, 78, 130, 1, "NONE"),
    new Driver("haberfeld", "マリオ・ハーバーフェルド", "ブラジル", 78, 78, 83, 85, 100, 1, "DEV_UP"),
    new Driver("wildheim", "ビヨン・ヴィルドハイム", "スウェーデン", 80, 81, 83, 78, 120, 1, "NONE"),
    new Driver("enge", "トーマス・エンゲ", "チェコ", 80, 81, 82, 85, 150, 1, "NONE"),
    new Driver("pantano", "ジョルジオ・パンターノ", "イタリア", 82, 81, 79, 79, 120, 1, "NONE"),
    new Driver("kiesa", "ニコラス・キエーサ", "デンマーク", 80, 81, 95, 89, 120, 1, "NONE"),
    new Driver("treluyer", "ブノワ・トレルイエ", "フランス", 83, 83, 88, 88, 140, 1, "NONE"),
    new Driver("takagi", "高木虎之介", "日本", 86, 84, 82, 83, 250, 1, "NONE"),
    new Driver("fukuda", "福田良", "日本", 83, 83, 80, 78, 180, 1, "NONE"),
    new Driver("kaneishi", "金石年弘", "日本", 83, 83, 78, 80, 180, 1, "NONE"),
    new Driver("briscoe", "ライアン・ブリスコー", "オーストラリア", 81, 82, 80, 84, 150, 1, "NONE"),
    new Driver("zonta", "リカルド・ゾンタ", "ブラジル", 82, 85, 78, 83, 240, 1, "DEV_UP"),
    new Driver("manning", "ダレン・マニング", "イギリス", 84, 84, 85, 85, 300, 1, "DEV_UP"),
    new Driver("ihara", "井原慶子", "日本", 85, 85, 83, 89, 200, 1, "NONE"),
    new Driver("bobbi", "マッテオ・ボッビ", "イタリア", 78, 78, 85, 80, 90, 1, "DEV_UP"),
    new Driver("bourdais", "セバスチャン・ボーデ", "フランス", 83, 86, 77, 76, 200, 1, "NONE"),
    new Driver("paffett", "ゲイリー・パフェット", "イギリス", 85, 85, 82, 80, 200, 1, "NONE"),
    new Driver("glock", "ティモ・グロック", "ドイツ", 82, 82, 90, 77, 140, 1, "NONE"),
    new Driver("winkelhock", "マーカス・ヴィンケルホック", "ドイツ", 78, 78, 88, 50, 90, 1, "NONE"),
    new Driver("alesi", "ジャン・アレジー", "フランス", 94, 91, 99, 85, 2000, 1, "NONE"),
    new Driver("burti", "ルチアーノ・ブルティ", "ブラジル", 80, 80, 72, 80, 100, 1, "NONE"),
    new Driver("mazzacane", "ガストン・マッツァカーネ", "アルゼンチン", 78, 78, 88, 80, 110, 1, "NONE"),
    new Driver("hornish", "サム・ホーニッシュ・ジュニア", "アメリカ", 93, 95, 92, 94, 2200, 1, "NONE"),
    new Driver("castroneves", "エリオ・カストロネベス", "ブラジル", 90, 90, 92, 98, 1500, 1, "RACE_BONUS_US"),
    new Driver("deferran", "ジル・ド・フェラン", "ブラジル", 98, 95, 90, 95, 2500, 1, "NONE"),
    new Driver("fisher", "サラ・フィッシャー", "アメリカ", 81, 81, 80, 85, 130, 1, "NONE")
];

// ----------------------------------------------------------------
// 3-6. 2003年 レースカレンダー (全16戦)
// (messages[31].chunks[0] と 2003年史実カレンダー & ユーザー修正)
// ----------------------------------------------------------------
const RACE_CALENDAR = [
    new RaceTrack(1, "オーストラリアGP", "Normal"),
    new RaceTrack(2, "マレーシアGP", "Normal"), // (ミシュランボーナスは別で処理)
    new RaceTrack(3, "ブラジルGP", "Normal"),
    new RaceTrack(4, "サンマリノGP", "Normal"),
    new RaceTrack(5, "スペインGP", "Normal"),
    new RaceTrack(6, "オーストリアGP", "Normal"),
    new RaceTrack(7, "モナコGP", "Cornering"), // ★コーナリング重視
    new RaceTrack(8, "カナダGP", "Normal"),
    new RaceTrack(9, "ヨーロッパGP", "Normal"),
    new RaceTrack(10, "フランスGP", "Normal"),
    new RaceTrack(11, "イギリスGP", "Normal"),
    new RaceTrack(12, "ドイツGP", "Normal"),
    new RaceTrack(13, "ハンガリーGP", "Cornering"), // ★コーナリング重視 (ミシュランボーナスも対象)
    new RaceTrack(14, "イタリアGP", "Straight"), // ★ストレート重視
    new RaceTrack(15, "アメリカGP", "Straight"), // ★ストレート重視
    new RaceTrack(16, "日本GP", "Normal")
];

// ----------------------------------------------------------------
// 3-7. シーズン中の開発ターン数
// (messages[37].chunks[0])
// ----------------------------------------------------------------
const DEVELOPMENT_TURNS_PER_RACE = [
    // 開幕前 (これは PlayerTeam.developmentTurnsLeft で管理)
    1, // R1 -> R2 (オーストラリア -> マレーシア)
    1, // R2 -> R3
    1, // R3 -> R4
    1, // R4 -> R5
    1, // R5 -> R6
    1, // R6 -> R7
    1, // R7 -> R8
    1, // R8 -> R9
    0, // R9 -> R10 (ヨーロッパ -> フランス) ★連戦
    1, // R10 -> R11
    1, // R11 -> R12
    1, // R12 -> R13
    2, // R13 -> R14 (ハンガリー -> イタリア) ★夏休み
    1, // R14 -> R15
    1, // R15 -> R16 (アメリカ -> 日本)
    // R16 (最終戦)
];

// ----------------------------------------------------------------
// 3-8. スポンサーと開発の定義
// (messages[21].chunks[0], messages[35].chunks[0])
// ----------------------------------------------------------------
const SPONSOR_INDUSTRIES = ["石油", "カー用品", "タバコ", "通信", "機械", "ファッション", "小売", "金融", "メディア", "サービス"];
const SPONSOR_RANKS = {
    "S": 2000,
    "A": 1000,
    "B": 500,
    "C": 100
};
// 確率 (1年目)
const SPONSOR_PROB_YEAR_1 = { "S": 0.10, "A": 0.15, "B": 0.25, "C": 0.50 };
// (2年目・優勝なし)
const SPONSOR_PROB_YEAR_2_NO_WIN = { "S": 0.20, "A": 0.50, "B": 0.20, "C": 0.10 };
// (2年目・優勝あり)
const SPONSOR_PROB_YEAR_2_WIN = { "S": 0.60, "A": 0.25, "B": 0.10, "C": 0.05 };

const DEVELOPMENT_COST = 100; // 開発コスト 100万ドル
// 開発確率 (ドライバー0人)
const DEV_PROB_0 = { "great": 0.05, "normal": 0.70, "tradeoff": 0.25 };
// 開発確率 (ドライバー1人)
const DEV_PROB_1 = { "great": 0.15, "normal": 0.60, "tradeoff": 0.25 };
// 開発確率 (ドライバー2人)
const DEV_PROB_2 = { "great": 0.25, "normal": 0.50, "tradeoff": 0.25 };

// (gameData.js のファイルの一番下に追加します)

// ----------------------------------------------------------------
// 3-9. ★NEW!★ 特別アイテムショップのリスト
// (5年間で各1回のみ購入可能)
// ----------------------------------------------------------------
const SPECIAL_ITEMS_SHOP = [
    // 500万ドル
    { id: "item_wing_flex", name: "フレキシブルウィング", cost: 500, effects: { straight: 2, cornering: 0, reliability: 0, stability: 0 } },
    { id: "item_wheel_fairing", name: "ホイールフェアリング", cost: 500, effects: { straight: 1, cornering: 0, reliability: 0, stability: 1 } },
    { id: "item_mid_wing", name: "ミッドウィング", cost: 500, effects: { straight: 0, cornering: 1, reliability: 0, stability: 1 } },
    { id: "item_sidepod_slim", name: "サイドポッド絞り込み", cost: 500, effects: { straight: 0, cornering: 3, reliability: 0, stability: -1 } },
    { id: "item_shark_louver", name: "シャークルーバー", cost: 500, effects: { straight: 0, cornering: 0, reliability: 2, stability: 0 } },
    { id: "item_chimney_duct", name: "チムニーダクト", cost: 500, effects: { straight: 0, cornering: 0, reliability: 2, stability: 0 } },
    // 750万ドル
    { id: "item_launch_control", name: "ローンチコントロール改良", cost: 750, effects: { straight: 0, cornering: 0, reliability: 0, stability: 3 } },
    // 1000万ドル
    { id: "item_traction_control", name: "トラクションコントロール改良", cost: 1000, effects: { straight: 0, cornering: 4, reliability: 0, stability: 0 } },
    // 1500万ドル
    { id: "item_seamless_shift", name: "シームレスシフト", cost: 1500, effects: { straight: 3, cornering: 3, reliability: -3, stability: 3 } },
    // 2000万ドル
    { id: "item_f_duct", name: "Fダクト", cost: 2000, effects: { straight: 8, cornering: 0, reliability: 0, stability: 0 } },
    // 2500万ドル
    { id: "item_cfd", name: "CFD導入", cost: 2500, effects: { straight: 5, cornering: 5, reliability: 0, stability: 0 } },
    { id: "item_mass_damper", name: "マスダンパー", cost: 2500, effects: { straight: 0, cornering: 4, reliability: 0, stability: 6 } },
    // 4000万ドル
    { id: "item_test_team", name: "テストチーム結成", cost: 4000, effects: { straight: 0, cornering: 0, reliability: 8, stability: 8 } },
    // 4500万ドル
    { id: "item_wind_tunnel", name: "新風洞建設", cost: 4500, effects: { straight: 6, cornering: 6, reliability: 0, stability: 6 } }
];