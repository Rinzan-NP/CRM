import React from 'react'

const Card = ({ title, value }) => {
  return (
    <div className="bg-white shadow rounded p-4">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-2xl text-blue-600">{value}</p>
    </div>
  )
}

export default Card


