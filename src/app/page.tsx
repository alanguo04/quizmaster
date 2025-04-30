import FileUploader from "./fileuploader";
import Image from "next/image";

export default function Home() {
  return (
    <FileUploader />
    // <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
    //     <form>
    //       <label htmlFor="fname">Upload Files:</label><br />
    //       <input type="text" id="fname" name="fname" /><br />
    //     </form>
    // </div>
  );
}
