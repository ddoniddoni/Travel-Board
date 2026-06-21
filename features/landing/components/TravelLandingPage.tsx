import Link from "next/link";
import styles from "./TravelLandingPage.module.css";

const notes = [
  ["일정 라이브러리", "여행 보드를 저장하고, 이어서 계획하세요."],
  ["하루의 리듬", "시간을 옮기고, 더 여유롭게 조절하세요."],
  ["장소 연결", "일정과 장소, 지도를 한 번에 확인하세요."],
  ["백업", "여행 기록을 내보내고 언제든 다시 불러오세요."],
];

export function TravelLandingPage() {
  return (
    <main className={styles.page} id="main-content">
      <a className={styles.skipLink} href="#hero">본문으로 건너뛰기</a>
      <header className={styles.nav}>
        <Link className={styles.logo} href="/" translate="no">travelboard</Link>
        <Link className={styles.navLink} href="/planner">보드 열기 <span aria-hidden="true">↗</span></Link>
      </header>

      <section className={styles.heroScene} id="hero">
        <div className={styles.atmosphere} aria-hidden="true" />
        <article className={styles.heroCard}>
          <span className={styles.mark} aria-hidden="true">✦</span>
          <h1>여행의 모든 흐름을<br />한 장의 보드에.</h1>
          <p>여행지, 장소, 동선, 시간까지.<br />복잡한 준비를 한 화면에 정리합니다.</p>
          <Link className={styles.primaryButton} href="/planner">여행 보드 만들기 <span aria-hidden="true">↓</span></Link>
        </article>

        <div className={styles.noteCloud} aria-label="여행 보드 핵심 기능">
          {notes.map(([title, copy], index) => (
            <article className={`${styles.note} ${styles[`note${index + 1}`]}`} key={title}>
              <h2>{title}</h2><p>{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.productSection}>
        <p className={styles.caption}>TRAVELBOARD IN YOUR BROWSER</p>
        <div className={styles.appFrame}>
          <div className={styles.appBar}><span>travelboard</span><span>저장됨 · 오사카 3일</span></div>
          <div className={styles.appBody}>
            <aside><p>여행 조건</p><b>오사카</b><span>2026. 06. 28 — 30</span><i>맛집 · 카페 · 산책</i></aside>
            <section><p>DAY 01 · SHINSAIBASHI</p><div><time>09:30</time><b>커피로 시작하는 아침</b></div><div className={styles.current}><time>12:00</time><b>도톤보리 골목 산책</b></div><div><time>16:30</time><b>느긋한 오후의 카페</b></div></section>
            <div className={styles.map}><i /><i /><b>1</b><b>2</b><b>3</b><span>OSAKA</span></div>
          </div>
        </div>
      </section>

      <section className={styles.afterword}>
        <p>Plan with less noise.</p><h2>여행을 떠나기 전,<br />이미 여행하는 기분.</h2><Link href="/planner">지금 시작하기 <span aria-hidden="true">→</span></Link>
      </section>
      <footer className={styles.footer}><span translate="no">travelboard</span><span>PLAN WITH CLARITY.</span></footer>
    </main>
  );
}
