import { motion } from 'framer-motion';
import { FaWheelchair, FaHands, FaPalette, FaFire, FaClock, FaUsers } from 'react-icons/fa';
import { TbRotateDot } from "react-icons/tb";

const Studio = () => {
  return (
    <section className="py-20 px-4 bg-gradient-to-b from-white to-ceramic-50">
      <div className="container mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-display font-bold text-ceramic-800 mb-6">
            About Imani Ceramic Studio
          </h2>
          <p className="text-xl text-ceramic-700 max-w-3xl mx-auto">
            A welcoming creative space in Nairobi where beginners and experienced potters come together to work with clay.
          </p>
        </motion.div>


        {/* Process Highlights */}
        <div className="grid md:grid-cols-4 gap-8 mb-20">
          <motion.div whileInView={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 20 }} className="text-center bg-white p-8 rounded-2xl shadow-lg">

<grok-card data-id="50d589" data-type="image_card"  data-arg-size="LARGE" ></grok-card>

            <TbRotateDot className="text-5xl text-ceramic-600 mx-auto my-4" />
            <h3 className="text-xl font-bold text-ceramic-800 mb-2">Wheel Throwing</h3>
            <p className="text-ceramic-600">Professional wheels with hands-on guidance</p>
          </motion.div>

          <motion.div whileInView={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 20 }} transition={{ delay: 0.1 }} className="text-center bg-white p-8 rounded-2xl shadow-lg">

<grok-card data-id="29ab83" data-type="image_card"  data-arg-size="LARGE" ></grok-card>

            <FaHands className="text-5xl text-ceramic-600 mx-auto my-4" />
            <h3 className="text-xl font-bold text-ceramic-800 mb-2">Hand Building</h3>
            <p className="text-ceramic-600">Free-form sculpting with slabs, coils & pinch</p>
          </motion.div>

          <motion.div whileInView={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 20 }} transition={{ delay: 0.2 }} className="text-center bg-white p-8 rounded-2xl shadow-lg">

<grok-card data-id="120b66" data-type="image_card"  data-arg-size="LARGE" ></grok-card>

            <FaPalette className="text-5xl text-ceramic-600 mx-auto my-4" />
            <h3 className="text-xl font-bold text-ceramic-800 mb-2">Painting & Glazing</h3>
            <p className="text-ceramic-600">Imported underglazes and premium glazes</p>
          </motion.div>

          <motion.div whileInView={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 20 }} transition={{ delay: 0.3 }} className="text-center bg-white p-8 rounded-2xl shadow-lg">

<grok-card data-id="ed48b7" data-type="image_card"  data-arg-size="LARGE" ></grok-card>

            <FaFire className="text-5xl text-ceramic-600 mx-auto my-4" />
            <h3 className="text-xl font-bold text-ceramic-800 mb-2">Professional Firing</h3>
            <p className="text-ceramic-600">Kiln-fired for beautiful, durable results</p>
          </motion.div>
        </div>

        {/* Special Features */}
        <div className="bg-ceramic-100 rounded-3xl p-10">
          <h3 className="text-3xl font-bold text-ceramic-800 mb-8 text-center">What Makes Us Unique</h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center bg-white p-8 rounded-2xl shadow-lg">

<grok-card data-id="6d87db" data-type="image_card"  data-arg-size="LARGE" ></grok-card>

              <h4 className="text-xl font-bold text-ceramic-700 mt-6 mb-3">Colored Clay Creations</h4>
              <p className="text-ceramic-600">Mix your own vibrant colored clays (like in Package 7)</p>
            </div>
            <div className="text-center bg-white p-8 rounded-2xl shadow-lg">
              <FaUsers className="text-6xl text-ceramic-600 mx-auto mb-6" />
              <h4 className="text-xl font-bold text-ceramic-700 mb-3">All Levels Welcome</h4>
              <p className="text-ceramic-600">Beginners to hobbyists — everyone belongs</p>
            </div>
            <div className="text-center bg-white p-8 rounded-2xl shadow-lg">
              <FaClock className="text-6xl text-ceramic-600 mx-auto mb-6" />
              <h4 className="text-xl font-bold text-ceramic-700 mb-3">Flexible Sessions</h4>
              <p className="text-ceramic-600">Unlimited time packages & hobbyist rates</p>
            </div>
          </div>
        </div>

        {/* Closing */}
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} className="text-center mt-20">
          <p className="text-2xl text-ceramic-700 italic mb-6">
            "Stay Calm and Potter With Imani Ceramic"
          </p>
          <p className="text-lg text-ceramic-600">
            Join our creative community in Nairobi. Your pottery journey starts here.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default Studio;