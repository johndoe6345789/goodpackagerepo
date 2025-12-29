import '../styles/globals.scss';
import Navbar from '../components/Navbar';

export const metadata = {
  title: 'Good Package Repo',
  description: 'World\'s first good package repository',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
