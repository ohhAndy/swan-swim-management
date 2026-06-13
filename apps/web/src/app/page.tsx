import styles from "./page.module.css";
import { redirect } from "next/navigation";

export default function Home() {
  redirect("dashboard");
  return (
    <div className={styles.page}>
      <main className={styles.main}></main>
    </div>
  );
}
