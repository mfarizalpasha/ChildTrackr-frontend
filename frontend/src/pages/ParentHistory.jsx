import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { getMeParent } from '../features/parentSlice';
import Layout from './Layout';
import axios from 'axios';
import moment from 'moment';

function ParentHistory() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isError } = useSelector((state) => state.parent);

  const [childHistory, setChildHistory] = useState([]);

  useEffect(() => {
    dispatch(getMeParent());
  }, [dispatch]);

  useEffect(() => {
    if (isError) {
      navigate('/');
    }
  }, [isError, navigate]);

  useEffect(() => {
    const getChildHistory = async () => {
      const token = localStorage.getItem('token');
      try {
        const response = await axios.get(process.env.REACT_APP_linkNgrok + '/history/data', {
          headers: {
            Authorization: `${token}`
          }
        });

        if (response.status === 200) {
          const childHistoryData = response.data.map((item) => ({
            childName: item.username,
            latitude: item.latitude,
            longitude: item.longitude,
            startTime: item.start_time,
            endTime: item.end_time,
            date: item.createdAt
            // address: getGeocodingData(item.latitude, item.longitude)
          }));
          setChildHistory(childHistoryData);
        } else {
          console.log('Request Error:', response.status);
        }
      } catch (error) {
        console.log('Error:', error.message);
      }
    };

    getChildHistory();
  }, []);

  useEffect(() => {
    // Use a dictionary to store addresses for child histories
    const addressDictionary = {};

    const getPlacemarkFromCoordinates = async (history) => {
      const { latitude, longitude } = history;

      if (!addressDictionary[`${latitude}_${longitude}`]) {
        console.log(latitude);
        console.log(longitude);
        try {
          const response = await axios.get(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          const addressData = response.data;

          if (addressData) {
            const address = `${addressData.address.road}, ${addressData.address.city}`;
            addressDictionary[`${latitude}_${longitude}`] = address;
            // Update the address for this history object
            setChildHistory((prevChildHistory) => {
              return prevChildHistory.map((item) => {
                if (item === history) {
                  return { ...item, address };
                }
                return item;
              });
            });
          }
        } catch (e) {
          console.error('Error getting address:', e);
        }
      }
    };

    // Fetch addresses for child histories
    // childHistory.forEach((history) => {
    //   getPlacemarkFromCoordinates(history);
    // });
  }, [childHistory]);

  function convertToIndonesianTime(time) {
    const [hour, minute] = time.split(':');
    let formattedHour = parseInt(hour);
    formattedHour += 7;
    if (formattedHour >= 24) {
      formattedHour -= 24;
    }
    if (formattedHour < 10) {
      return `0${formattedHour}:${minute}`;
    }
    return `${formattedHour}:${minute}`;
  }

  function displayDateFormat(date) {
    if (moment(date).format('DD MMMM YYYY') !== 'Invalid date') {
      return moment(date).utcOffset(-600).format('DD MMMM YYYY HH:mm');
    } else {
      return null;
    }
  }

  // const getAddress = async (data) => {
  //   axios
  //     .get(`https://nominatim.openstreetmap.org/reverse?lat=${data.latitude}&lon=${data.longitude}&format=json`)
  //     .then((response) => {
  //       console.log(response.data.display_name);
  //       console.log(response.data.address);
  //     })
  //     .catch((error) => {
  //       console.error('Error:', error);
  //     });
  // };

  const getGeocodingData = (latitude, longitude) => {
    // const latitude = 38.748;
    // const longitude = -9.103;
    const API_URL = 'https://nominatim.openstreetmap.org/reverse';
    axios
      .get(API_URL, {
        headers: {
          'Content-Type': 'application/json'
        },
        params: {
          lat: latitude,
          lon: longitude,
          format: 'json'
        }
      })
      .then((response) => {
        return response.display_name;
      })
      .catch((error) => {
        console.log(error);
      });
    // console.log(response.data.display_name);
    // console.log(response.data.address);
  };

  useEffect(() => {
    getGeocodingData();
  }, []);

  return (
    <Layout roleTitle="Parent">
      <div className="column">
        <h1 className="title mt-4 is-2">History</h1>
        <div className="row">
          {childHistory.map((historyData, index) => (
            <div className="box modified ml-3" key={index}>
              <div>
                {historyData.childName}
                <br />
                Pukul: {convertToIndonesianTime(historyData.startTime)} - {convertToIndonesianTime(historyData.endTime)}{' '}
                <br />
                Lokasi: {historyData.latitude}, {historyData.longitude}
                <span className="to-the-right">{displayDateFormat(historyData.date)}</span>
                {/* {historyData.address} */}
                {/* {console.log(getAddress(historyData))} */}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}

export default ParentHistory;
