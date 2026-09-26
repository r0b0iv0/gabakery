import "./Footer.css";
import {
    FaFacebookF,
    FaInstagram,
    FaTiktok,
    FaPhone,
    FaLocationDot,
} from "react-icons/fa6";

export function Footer() {
    return (
        <footer className="footer">
            <div className="footer-content">

                <div className="footer-brand">
                    <h2>GaBakery</h2>
                    <p>
                        Сладки моменти, създадени с любов.
                    </p>
                </div>

                <div className="footer-contact">
                    <h3>Свържете се с нас</h3>

                    <a href="tel:+359878435444">
                        <FaPhone />
                        <span>0878 435 444</span>
                    </a>

                    <a
                        href="https://www.google.com/maps/search/?api=1&query=ул.+Христо+Белчев+30,+София"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <FaLocationDot />
                        <span>
                            ул. „Христо Белчев“ 30,
                            <br />
                            1000 София
                        </span>
                    </a>
                </div>

                <div className="footer-social">
                    <h3>Последвайте ни</h3>

                    <div className="social-icons">
                        <a
                            href="#"
                            aria-label="Facebook"
                        >
                            <FaFacebookF />
                        </a>

                        <a
                            href="#"
                            aria-label="Instagram"
                        >
                            <FaInstagram />
                        </a>

                        <a
                            href="#"
                            aria-label="TikTok"
                        >
                            <FaTiktok />
                        </a>
                    </div>
                </div>

            </div>

            <div className="footer-bottom">
                <span>© 2026 GaBakery</span>
                <span>Всички права запазени.</span>
            </div>
        </footer>
    );
}
