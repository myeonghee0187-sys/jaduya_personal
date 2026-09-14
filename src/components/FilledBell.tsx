/** 헤더 전용 solid bell. Lucide outline이 아닌 실제 면으로 구성된 SVG path다. */
export function FilledBell() {
  return (
    <svg
      className="filled-bell"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        fill="currentColor"
        d="M12 2.5C11.17 2.5 10.5 3.17 10.5 4V4.58C7.87 5.25 6 7.65 6 10.5V14.2C6 15.04 5.7 15.85 5.16 16.5L3.75 18.19C3.24 18.8 3.67 19.72 4.47 19.72H19.53C20.33 19.72 20.76 18.8 20.25 18.19L18.84 16.5C18.3 15.85 18 15.04 18 14.2V10.5C18 7.65 16.13 5.25 13.5 4.58V4C13.5 3.17 12.83 2.5 12 2.5Z"
      />
      <path
        fill="currentColor"
        d="M9.4 20.5C9.75 21.39 10.63 22 12 22C13.37 22 14.25 21.39 14.6 20.5H9.4Z"
      />
    </svg>
  );
}

export default FilledBell;
