import React from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "./Carousel.css";

const Carousel = () => {
  const userName = localStorage.getItem("userName") || "User";

  const slides = [
    { title: `Welcome, ${userName}`, subtitle: "Happy to see you back", img: "https://i.ibb.co/cXKqRXMN/s3-6af90c49ed3ead48f32b.jpg" },
    { title: "Explore Our Services", subtitle: "Find what suits you best", img: "https://i.ibb.co/n8Q68Zvm/s1-d188ee8ecd63e9f254da.jpg" },
    { title: "Exclusive Offers", subtitle: "Don't miss out!", img: "https://i.ibb.co/j9BNHG0C/s4-af6c2349bff585218d85.jpg" },
    { title: "Join Our Community", subtitle: "Stay updated with the latest", img: "https://i.ibb.co/bMb1b3Y2/team.png" },
  ];

  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    arrows: false,
  };

  return (
    <div className="carousel-container">
      <Slider {...settings}>
        {slides.map((slide, index) => (
          <div key={index} className="slide">
            <div className="slide-content">
              <div className="slide-text">
                <h2>{slide.title}</h2>
                <p>{slide.subtitle}</p>
              </div>
              <div className="slide-image">
                <img src={slide.img} alt="Slide" />
              </div>
            </div>
          </div>
        ))}
      </Slider>
    </div>
  );
};

export default Carousel;