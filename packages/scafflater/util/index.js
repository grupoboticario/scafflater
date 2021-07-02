const maskParameters = (parameters, templateParameters) => {
  if(!templateParameters || !parameters)
    return parameters

  for (const p of templateParameters) {
    if(p.mask){
      parameters[p.name] = '******'
    }
  }

  return parameters;
}


module.exports = {
  maskParameters
}
